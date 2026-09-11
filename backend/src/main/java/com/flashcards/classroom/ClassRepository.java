package com.flashcards.classroom;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassRepository extends JpaRepository<StudyClass, UUID> {

    @Query("""
            SELECT c FROM StudyClass c
            JOIN FETCH c.teacher
            WHERE c.teacher.id = :teacherId
            ORDER BY c.updatedAt DESC
            """)
    List<StudyClass> findByTeacher_IdOrderByUpdatedAtDesc(@Param("teacherId") UUID teacherId);

    @Query("""
            SELECT c FROM StudyClass c
            JOIN FETCH c.teacher
            WHERE c.id = :id AND c.teacher.id = :teacherId
            """)
    Optional<StudyClass> findByIdAndTeacher_Id(@Param("id") UUID id, @Param("teacherId") UUID teacherId);

    @Query("""
            SELECT c FROM StudyClass c
            JOIN FETCH c.teacher
            WHERE c.joinCode = :joinCode
            """)
    Optional<StudyClass> findByJoinCode(@Param("joinCode") String joinCode);

    boolean existsByJoinCode(String joinCode);

    @Query("""
            SELECT c FROM StudyClass c
            JOIN FETCH c.teacher
            WHERE c.id = :id
              AND (c.teacher.id = :userId
                OR EXISTS (
                    SELECT m.id FROM ClassMember m
                    WHERE m.studyClass = c AND m.user.id = :userId
                ))
            """)
    Optional<StudyClass> findVisible(@Param("id") UUID id, @Param("userId") UUID userId);
}
