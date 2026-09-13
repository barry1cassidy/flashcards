package com.flashcards.mix;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyMixRepository extends JpaRepository<StudyMix, UUID> {

    List<StudyMix> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    Optional<StudyMix> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUser_IdAndNameIgnoreCase(UUID userId, String name);

    boolean existsByUser_IdAndNameIgnoreCaseAndIdNot(UUID userId, String name, UUID id);
}
