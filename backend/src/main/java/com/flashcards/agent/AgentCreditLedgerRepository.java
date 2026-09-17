package com.flashcards.agent;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentCreditLedgerRepository extends JpaRepository<AgentCreditLedger, UUID> {

    boolean existsByReasonAndProviderRef(CreditReason reason, String providerRef);

    Optional<AgentCreditLedger> findByReasonAndProviderRef(CreditReason reason, String providerRef);
}
