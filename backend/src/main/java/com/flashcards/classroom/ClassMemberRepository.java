package com.flashcards.classroom;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassMemberRepository extends JpaRepository<ClassMember, UUID> {

    @Query("""
            SELECT m FROM ClassMember m
            JOIN FETCH m.user
            WHERE m.studyClass.id = :classId
            ORDER BY m.joinedAt ASC
            """)
    List<ClassMember> findByStudyClass_IdOrderByJoinedAtAsc(@Param("classId") UUID classId);

    @Query("""
            SELECT m FROM ClassMember m
            JOIN FETCH m.studyClass c
            JOIN FETCH c.teacher
            WHERE m.user.id = :userId
            ORDER BY m.joinedAt DESC
            """)
    List<ClassMember> findByUser_IdOrderByJoinedAtDesc(@Param("userId") UUID userId);

    Optional<ClassMember> findByStudyClass_IdAndUser_Id(UUID classId, UUID userId);

    boolean existsByStudyClass_IdAndUser_Id(UUID classId, UUID userId);

    long countByStudyClass_Id(UUID classId);

    void deleteByStudyClass_IdAndUser_Id(UUID classId, UUID userId);

    List<ClassMember> findByStudyClass_IdIn(Collection<UUID> classIds);
}
