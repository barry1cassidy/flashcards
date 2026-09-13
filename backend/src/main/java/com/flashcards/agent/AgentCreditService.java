package com.flashcards.agent;

import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.ProAccess;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class AgentCreditService {

    private final UserRepository userRepository;
    private final AgentCreditLedgerRepository ledgerRepository;
    private final AgentProperties properties;

    public AgentCreditService(
            UserRepository userRepository,
            AgentCreditLedgerRepository ledgerRepository,
            AgentProperties properties) {
        this.userRepository = userRepository;
        this.ledgerRepository = ledgerRepository;
        this.properties = properties;
    }

    @Transactional
    public CreditBalance snapshot(UUID userId) {
        return snapshot(requireUser(userId));
    }

    @Transactional
    public CreditBalance snapshot(User user) {
        applyPeriod(user);
        userRepository.save(user);
        return balanceOf(user);
    }

    @Transactional
    public CreditBalance consume(UUID userId) {
        User user = requireUser(userId);
        applyPeriod(user);
        if (!ProAccess.allowed(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Pro license required");
        }
        if (user.getAgentIncludedCredits() <= 0 && user.getAgentAddonCredits() <= 0) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Out of AI credits");
        }
        CreditBucket bucket;
        if (user.getAgentIncludedCredits() > 0) {
            user.setAgentIncludedCredits(user.getAgentIncludedCredits() - 1);
            bucket = CreditBucket.INCLUDED;
        } else {
            user.setAgentAddonCredits(user.getAgentAddonCredits() - 1);
            bucket = CreditBucket.ADDON;
        }
        ledger(user.getId(), -1, bucket, CreditReason.GENERATE, UUID.randomUUID().toString());
        userRepository.save(user);
        return balanceOf(user);
    }

    @Transactional
    public CreditBalance grantAddonPurchase(UUID userId, String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed");
        }
        User user = requireUser(userId);
        String ref = sessionId.trim();
        if (ledgerRepository.existsByReasonAndProviderRef(CreditReason.ADDON_PURCHASE, ref)) {
            return snapshot(user);
        }
        int pack = properties.addonCredits();
        user.setAgentAddonCredits(user.getAgentAddonCredits() + pack);
        ledger(user.getId(), pack, CreditBucket.ADDON, CreditReason.ADDON_PURCHASE, ref);
        userRepository.save(user);
        return balanceOf(user);
    }

    private void applyPeriod(User user) {
        if (!ProAccess.allowed(user)) {
            if (user.getAgentIncludedCredits() != 0 || user.getAgentCreditPeriod() != null) {
                user.setAgentIncludedCredits(0);
                user.setAgentCreditPeriod(null);
            }
            return;
        }
        String period = YearMonth.now(ZoneOffset.UTC).toString();
        if (period.equals(user.getAgentCreditPeriod())) {
            return;
        }
        String ref = user.getId() + ":" + period;
        int grant = properties.monthlyCredits();
        user.setAgentIncludedCredits(grant);
        user.setAgentCreditPeriod(period);
        if (!ledgerRepository.existsByReasonAndProviderRef(CreditReason.PERIOD_GRANT, ref)) {
            ledger(user.getId(), grant, CreditBucket.INCLUDED, CreditReason.PERIOD_GRANT, ref);
        }
    }

    private void ledger(UUID userId, int amount, CreditBucket bucket, CreditReason reason, String providerRef) {
        AgentCreditLedger row = new AgentCreditLedger();
        row.setUserId(userId);
        row.setAmount(amount);
        row.setBucket(bucket);
        row.setReason(reason);
        row.setProviderRef(providerRef);
        ledgerRepository.save(row);
    }

    private static CreditBalance balanceOf(User user) {
        return CreditBalance.of(user.getAgentIncludedCredits(), user.getAgentAddonCredits());
    }

    private User requireUser(UUID userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }
}
