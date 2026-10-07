package com.flashcards.auth;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountCodeRepository extends JpaRepository<AccountCode, UUID> {

    Optional<AccountCode> findByUser_IdAndPurpose(UUID userId, AccountCodePurpose purpose);
}
