package com.flashcards.billing;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({BillingProperties.class, ZipconvoStoreProperties.class})
public class BillingConfig {
}
