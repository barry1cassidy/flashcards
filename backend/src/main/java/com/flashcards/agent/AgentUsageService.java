package com.flashcards.agent;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.common.ApiException;

@Service
public class AgentUsageService {

    private final AgentDailyUsageRepository usageRepository;
    private final AgentProperties properties;

    public AgentUsageService(AgentDailyUsageRepository usageRepository, AgentProperties properties) {
        this.usageRepository = usageRepository;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public int remainingToday(UUID userId) {
        int used = usageRepository
                .findByUserIdAndUsageDate(userId, LocalDate.now())
                .map(AgentDailyUsage::getCallCount)
                .orElse(0);
        return Math.max(0, properties.dailyLimit() - used);
    }

    @Transactional
    public int consume(UUID userId) {
        LocalDate today = LocalDate.now();
        AgentDailyUsage usage = usageRepository.findByUserIdAndUsageDate(userId, today).orElseGet(() -> {
            AgentDailyUsage created = new AgentDailyUsage();
            created.setUserId(userId);
            created.setUsageDate(today);
            created.setCallCount(0);
            return created;
        });
        if (usage.getCallCount() >= properties.dailyLimit()) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Daily AI limit reached");
        }
        usage.setCallCount(usage.getCallCount() + 1);
        usageRepository.save(usage);
        return properties.dailyLimit() - usage.getCallCount();
    }
}
