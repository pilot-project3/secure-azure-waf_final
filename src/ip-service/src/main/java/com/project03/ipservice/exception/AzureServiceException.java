package com.project03.ipservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class AzureServiceException extends RuntimeException {

    public AzureServiceException(String message) {
        super(message);
    }

    public AzureServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}