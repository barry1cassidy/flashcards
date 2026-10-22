package com.flashcards.studio;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudioSampleSceneRepository extends JpaRepository<StudioSampleScene, UUID> {

    Optional<StudioSampleScene> findBySlug(String slug);

    List<StudioSampleScene> findAllByOrderByPositionAsc();
}
