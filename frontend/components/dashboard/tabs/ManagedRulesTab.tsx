import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Rule {
  id: number;
  name: string;
  ruleGroups: string[];
  enabled: boolean;
  details: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  appliedRules?: string[];
}

interface RuleGroupOverride {
  ruleGroupName: string;
  rules: {
    ruleId: string;
    enabledState: string;
    action: string;
    exclusions: any[];
  }[];
  exclusions: any[];
}

interface ManagedRuleSet {
  ruleSetType: string;
  ruleSetVersion: string;
  ruleSetAction: string | null;
  ruleGroupOverrides: RuleGroupOverride[];
  exclusions: any[];
}

interface WafPolicyResponse {
  properties: {
    managedRules: {
      managedRuleSets: ManagedRuleSet[];
    };
  };
}

const ManagedRulesTab: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([
    {
      id: 1,
      name: '경로 탐색 공격 차단',
      ruleGroups: ['MS-ThreatIntel-AppSec', 'LFI'],
      enabled: true,
      details: '로컬 파일 포함(LFI) 공격을 차단하여 서버의 민감한 파일에 대한 무단 접근을 방지합니다.'
    },
    {
      id: 2,
      name: '웹쉘 업로드 및 실행 차단',
      ruleGroups: ['MS-ThreatIntel-SQLI', 'SQLI'],
      enabled: true,
      details: 'SQL 인젝션 공격을 차단하여 데이터베이스에 대한 무단 접근을 방지합니다.'
    },
    {
      id: 3,
      name: '웹쉘 업로드 및 실행 차단',
      ruleGroups: ['MS-ThreatIntel-WebShells'],
      enabled: true,
      details: '악성 웹쉘 업로드 및 실행을 차단하여 서버에 대한 무단 접근을 방지합니다.'
    },
    {
      id: 4,
      name: '스크립트 삽입(XSS) 공격 차단',
      ruleGroups: ['XSS'],
      enabled: true,
      details: '크로스 사이트 스크립팅(XSS) 공격을 차단하여 사용자 브라우저에서 악성 스크립트 실행을 방지합니다.'
    },
    {
      id: 5,
      name: '세션 탈취/고정 공격 차단',
      ruleGroups: ['FIX'],
      enabled: true,
      details: '세션 고정 및 탈취 공격을 차단하여 사용자 세션의 보안을 강화합니다.'
    },
    {
      id: 6,
      name: '스프링 프레임워크 공격 차단',
      ruleGroups: ['MS-ThreatIntel-CVEs'],
      enabled: true,
      details: '알려진 스프링 프레임워크 취약점을 이용한 공격을 차단합니다.'
    },
    {
      id: 7,
      name: '원격 파일 포함(RFI) 공격 차단',
      ruleGroups: ['RFI'],
      enabled: true,
      details: '원격 파일 포함(RFI) 공격을 차단하여 악성 코드 실행을 방지합니다.'
    },
    {
      id: 8,
      name: '원격 명령어 실행(RCE) 차단',
      ruleGroups: ['RCE'],
      enabled: true,
      details: '원격 명령어 실행(RCE) 공격을 차단하여 서버에서 임의의 명령어 실행을 방지합니다.'
    },
    {
      id: 9,
      name: '코드 실행 및 삽입 공격 차단',
      ruleGroups: ['PHP', 'JAVA', 'NODEJS', 'METHOD-ENFORCEMENT'],
      enabled: true,
      details: '다양한 프로그래밍 언어를 이용한 코드 실행 및 삽입 공격을 차단합니다.'
    },
    {
      id: 10,
      name: '프로토콜 공격 차단',
      ruleGroups: ['PROTOCOL-ATTACK', 'PROTOCOL-ENFORCEMENT'],
      enabled: true,
      details: 'HTTP/HTTPS 프로토콜 관련 공격을 차단하고 프로토콜 규칙을 강제합니다.'
    }
  ]);

  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuleStates = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const policyName = localStorage.getItem('wafPolicyName');
        const resourceGroupName = localStorage.getItem('resourceGroupName');

        if (!userId || !policyName || !resourceGroupName) {
          console.error('Required data not found in localStorage');
          return;
        }

        const response = await fetch(
          `http://20.249.205.79/api/rule/rule-sets?userId=${userId}&policyName=${policyName}&resourceGroupName=${resourceGroupName}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch rule states');
        }

        const data: WafPolicyResponse = await response.json();
        const managedRuleSet = data.properties.managedRules.managedRuleSets[0];
        
        if (!managedRuleSet) {
          console.error('No managed rule set found');
          return;
        }

        setRules(prevRules => prevRules.map(rule => {
          const ruleGroupOverride = managedRuleSet.ruleGroupOverrides.find(
            override => rule.ruleGroups.includes(override.ruleGroupName)
          );

          if (ruleGroupOverride && ruleGroupOverride.rules.length > 0) {
            const isEnabled = ruleGroupOverride.rules[0].enabledState === 'Enabled';
            return { ...rule, enabled: isEnabled };
          }

          return rule;
        }));
      } catch (error) {
        console.error('Error fetching rule states:', error);
        setError('규칙 상태를 불러오는데 실패했습니다.');
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchRuleStates();
  }, []);

  const handleToggleRule = (id: number) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleSaveRule = async () => {
    setIsApplying(true);
    setError(null);
    setShowSuccessAlert(false);

    try {
      const userId = localStorage.getItem('userId');
      const policyName = localStorage.getItem('wafPolicyName');
      const resourceGroupName = localStorage.getItem('resourceGroupName');

      if (!policyName || !resourceGroupName) {
        setError('정책 정보를 찾을 수 없습니다.');
        return;
      }

      const blockRuleList = rules
        .filter(rule => rule.enabled)
        .flatMap(rule => rule.ruleGroups);

      const response = await fetch('http://20.249.205.79/api/rule/rule-sets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          policyName: policyName,
          resourceGroupName: resourceGroupName,
          blockRuleList: blockRuleList
        }),
      });

      console.log(response);
      // const data: ApiResponse = await response.json();

      if (response.status === 202) {
        setShowSuccessAlert(true);
        setTimeout(() => setShowSuccessAlert(false), 5000);
      } else {
        // setError(data.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      {isInitialLoading ? (
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">OWASP Rule Set</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              OWASP에서 제공하는 WAF 규칙 세트입니다. 일반적인 웹 취약점과 악의적인 공격으로부터 애플리케이션을 보호합니다.
            </p>
          </div>

          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card 
                key={rule.id} 
                className={cn(
                  "p-4 transition-colors duration-200",
                  !rule.enabled && "bg-muted/50 opacity-70"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{rule.name}</h3>
                    <p className="text-sm text-muted-foreground">{rule.details}</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.ruleGroups?.map((group) => (
                        <Badge key={group} variant="secondary" className="text-xs">
                          {group}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Switch checked={rule.enabled} onCheckedChange={() => handleToggleRule(rule.id)} />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-center mt-4">
            <Button onClick={handleSaveRule} disabled={isApplying} className="w-full sm:w-auto gap-2" size="lg">
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  적용 중...
                </>
              ) : (
                '수정하기'
              )}
            </Button>
          </div>

          {/* 알림 */}
          {showSuccessAlert && (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-4">
              <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-12 max-w-2xl relative">
                <button
                  onClick={() => setShowSuccessAlert(false)}
                  className="absolute top-4 right-4 text-green-500 hover:text-green-700 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-12 w-12 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-2xl font-medium text-green-800">성공</h3>
                    <div className="mt-4 text-xl text-green-700">
                      <p>규칙이 성공적으로 적용되었습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-4">
              <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-12 max-w-2xl relative">
                <button
                  onClick={() => setError(null)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-12 w-12 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-2xl font-medium text-red-800">오류</h3>
                    <div className="mt-4 text-xl text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagedRulesTab; 