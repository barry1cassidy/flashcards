package com.flashcards.analytics;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(PostHogProperties.class)
public class AnalyticsConfig {
}
