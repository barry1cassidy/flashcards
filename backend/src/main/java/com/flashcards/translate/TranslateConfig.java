package com.flashcards.translate;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(TranslateProperties.class)
public class TranslateConfig {
}
