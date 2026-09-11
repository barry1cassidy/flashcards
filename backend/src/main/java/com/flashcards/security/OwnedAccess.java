package com.flashcards.security;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.flashcards.card.Card;
import com.flashcards.card.CardRepository;
import com.flashcards.classroom.ClassMemberRepository;
import com.flashcards.classroom.ClassRepository;
import com.flashcards.classroom.StudyClass;
import com.flashcards.common.ApiException;
import com.flashcards.deck.Deck;
import com.flashcards.deck.DeckRepository;
import com.flashcards.group.DeckGroup;
import com.flashcards.group.DeckGroupRepository;
import com.flashcards.mix.StudyMix;
import com.flashcards.mix.StudyMixRepository;

/**
 * Private resources are visible only to the account that owns them. A URL that
 * belongs to someone else is treated as missing (404), so callers cannot tell
 * whether the id exists.
 *
 * Classes use the same rule: {@link #requireClassMember} for anyone in the
 * class (teacher or student) and {@link #requireClassOwner} for the teacher.
 */
@Component
public class OwnedAccess {

    private final DeckRepository deckRepository;
    private final DeckGroupRepository groupRepository;
    private final CardRepository cardRepository;
    private final StudyMixRepository mixRepository;
    private final ClassRepository classRepository;
    private final ClassMemberRepository classMemberRepository;

    public OwnedAccess(
            DeckRepository deckRepository,
            DeckGroupRepository groupRepository,
            CardRepository cardRepository,
            StudyMixRepository mixRepository,
            ClassRepository classRepository,
            ClassMemberRepository classMemberRepository) {
        this.deckRepository = deckRepository;
        this.groupRepository = groupRepository;
        this.cardRepository = cardRepository;
        this.mixRepository = mixRepository;
        this.classRepository = classRepository;
        this.classMemberRepository = classMemberRepository;
    }

    public Deck requireDeck(UUID userId, UUID deckId) {
        return deckRepository
                .findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> hidden("Deck not found"));
    }

    public List<Deck> requireDecks(UUID userId, Collection<UUID> deckIds) {
        Set<UUID> unique = uniqueIds(deckIds);
        if (unique.isEmpty()) {
            return List.of();
        }
        List<Deck> owned = deckRepository.findByIdInAndUser_Id(unique, userId);
        if (owned.size() != unique.size()) {
            throw hidden("Deck not found");
        }
        return owned;
    }

    public DeckGroup requireSet(UUID userId, UUID setId) {
        return groupRepository
                .findByIdAndUserId(setId, userId)
                .orElseThrow(() -> hidden("Set not found"));
    }

    public List<DeckGroup> requireSets(UUID userId, Collection<UUID> setIds) {
        Set<UUID> unique = uniqueIds(setIds);
        if (unique.isEmpty()) {
            return List.of();
        }
        List<DeckGroup> owned = groupRepository.findByIdInAndUser_Id(unique, userId);
        if (owned.size() != unique.size()) {
            throw hidden("Set not found");
        }
        return owned;
    }

    public Card requireCard(UUID userId, UUID cardId) {
        return cardRepository
                .findByIdAndDeckUserId(cardId, userId)
                .orElseThrow(() -> hidden("Card not found"));
    }

    public StudyMix requireMix(UUID userId, UUID mixId) {
        return mixRepository
                .findByIdAndUserId(mixId, userId)
                .orElseThrow(() -> hidden("Study mix not found"));
    }

    public StudyClass requireClassOwner(UUID userId, UUID classId) {
        return classRepository
                .findByIdAndTeacher_Id(classId, userId)
                .orElseThrow(() -> hidden("Class not found"));
    }

    public StudyClass requireClassMember(UUID userId, UUID classId) {
        return classRepository
                .findVisible(classId, userId)
                .orElseThrow(() -> hidden("Class not found"));
    }

    public boolean isClassOwner(StudyClass studyClass, UUID userId) {
        return studyClass.getTeacher() != null && userId.equals(studyClass.getTeacher().getId());
    }

    public boolean isClassStudent(UUID userId, UUID classId) {
        return classMemberRepository.existsByStudyClass_IdAndUser_Id(classId, userId);
    }

    public static ApiException hidden(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    private static Set<UUID> uniqueIds(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Set.of();
        }
        LinkedHashSet<UUID> unique = new LinkedHashSet<>();
        for (UUID id : ids) {
            if (id != null) {
                unique.add(id);
            }
        }
        return unique;
    }
}
