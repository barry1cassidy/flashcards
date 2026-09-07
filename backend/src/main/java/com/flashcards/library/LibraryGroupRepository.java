package com.flashcards.library;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LibraryGroupRepository extends JpaRepository<LibraryGroup, UUID> {

    List<LibraryGroup> findAllByOrderByNameAsc();

    Optional<LibraryGroup> findBySlug(String slug);
}
