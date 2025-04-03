terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }
  required_version = ">= 1.4.0"
}

provider "azurerm" {
  features {}

  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
  subscription_id = var.subscription_id
}

# 변수 선언
variable "client_id" {}
variable "client_secret" {}
variable "tenant_id" {}
variable "subscription_id" {}
variable "static_web_app_url" {}
variable "resource_group_name" {}

# 리소스 그룹 조회
data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

# Front Door 프로필
resource "azurerm_cdn_frontdoor_profile" "fd_profile" {
  name                = "fdProfileStaticWeb"
  resource_group_name = data.azurerm_resource_group.rg.name
  sku_name            = "Premium_AzureFrontDoor"
}

# 엔드포인트 생성
resource "azurerm_cdn_frontdoor_endpoint" "fd_endpoint" {
  name                      = "fdEndpointStaticWeb"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd_profile.id
}

# Origin Group 생성
resource "azurerm_cdn_frontdoor_origin_group" "fd_origin_group" {
  name                     = "originGroupStaticWeb"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd_profile.id
  session_affinity_enabled = false

  health_probe {
    interval_in_seconds = 30
    path                = "/"
    protocol            = "Https"
    request_type        = "GET"
  }

  load_balancing {
    additional_latency_in_milliseconds = 0
    sample_size                        = 4
    successful_samples_required        = 3
  }
}

# Origin 설정
resource "azurerm_cdn_frontdoor_origin" "fd_origin" {
  name                            = "originStaticWeb"
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.fd_origin_group.id
  host_name                      = replace(var.static_web_app_url, "https://", "")
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = replace(var.static_web_app_url, "https://", "")
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = true
  enabled                        = true
}

# 라우트 설정
resource "azurerm_cdn_frontdoor_route" "fd_route" {
  name                          = "routeStaticWeb"
  cdn_frontdoor_endpoint_id    = azurerm_cdn_frontdoor_endpoint.fd_endpoint.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.fd_origin_group.id
  cdn_frontdoor_origin_ids     = [azurerm_cdn_frontdoor_origin.fd_origin.id]

  supported_protocols          = ["Http", "Https"]
  patterns_to_match            = ["/*"]
  forwarding_protocol          = "MatchRequest"
  https_redirect_enabled       = true
  link_to_default_domain       = true
  enabled                      = true
}

# WAF 정책
resource "azurerm_cdn_frontdoor_firewall_policy" "fd_waf_policy" {
  name                = "wafPolicyStaticWeb"
  resource_group_name = data.azurerm_resource_group.rg.name
  sku_name            = "Premium_AzureFrontDoor"

  custom_block_response_status_code = 403
  custom_block_response_body        = base64encode("Blocked by WAF")
  mode                              = "Prevention"

  managed_rule {
    type    = "Microsoft_DefaultRuleSet"
    version = "2.1"
    action  = "Block"
  }
}

# WAF 정책 연결
resource "azurerm_cdn_frontdoor_security_policy" "fd_waf_attach" {
  name                     = "fdSecurityPolicy"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd_profile.id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = azurerm_cdn_frontdoor_firewall_policy.fd_waf_policy.id

      association {
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.fd_endpoint.id
        }
        patterns_to_match = ["/*"]
      }
    }
  }
}

# ✅ Log Analytics 작업 영역 생성
resource "azurerm_log_analytics_workspace" "log_analytics" {
  name                = "logAnalyticsStaticWeb"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# ✅ Front Door 진단 설정
resource "azurerm_monitor_diagnostic_setting" "fd_diagnostic_setting" {
  name                       = "diagnosticSettingFrontDoor"
  target_resource_id         = azurerm_cdn_frontdoor_profile.fd_profile.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log_analytics.id
  log_analytics_destination_type = "Dedicated"

  enabled_log {
    category_group = "audit"
  }

  enabled_log {
    category_group = "allLogs"
  }


}

output "log_analytics_workspace_workspace_id" {
  value = azurerm_log_analytics_workspace.log_analytics.workspace_id
}

output "waf_policy_name" {
  value = azurerm_cdn_frontdoor_firewall_policy.fd_waf_policy.name
}

output "frontdoor_endpoint_host_name" {
  value = azurerm_cdn_frontdoor_endpoint.fd_endpoint.host_name
}