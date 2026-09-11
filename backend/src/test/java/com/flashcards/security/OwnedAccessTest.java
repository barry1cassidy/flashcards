package com.flashcards.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

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
import com.flashcards.user.User;

@ExtendWith(MockitoExtension.class)
class OwnedAccessTest {

    @Mock
    private DeckRepository deckRepository;
    @Mock
    private DeckGroupRepository groupRepository;
    @Mock
    private CardRepository cardRepository;
    @Mock
    private StudyMixRepository mixRepository;
    @Mock
    private ClassRepository classRepository;
    @Mock
    private ClassMemberRepository classMemberRepository;

    private OwnedAccess ownedAccess;
    private UUID ownerId;
    private UUID otherId;
    private UUID resourceId;

    @BeforeEach
    void setUp() {
        ownedAccess = new OwnedAccess(
                deckRepository,
                groupRepository,
                cardRepository,
                mixRepository,
                classRepository,
                classMemberRepository);
        ownerId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        otherId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        resourceId = UUID.fromString("00000000-0000-0000-0000-0000000000aa");
    }

    @Test
    void ownerCanLoadDeck() {
        Deck deck = new Deck();
        when(deckRepository.findByIdAndUserId(resourceId, ownerId)).thenReturn(Optional.of(deck));
        assertSame(deck, ownedAccess.requireDeck(ownerId, resourceId));
    }

    @Test
    void otherUserCannotLoadDeck() {
        when(deckRepository.findByIdAndUserId(resourceId, otherId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> ownedAccess.requireDeck(otherId, resourceId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Deck not found", ex.getMessage());
    }

    @Test
    void otherUserCannotLoadSet() {
        when(groupRepository.findByIdAndUserId(resourceId, otherId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> ownedAccess.requireSet(otherId, resourceId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Set not found", ex.getMessage());
    }

    @Test
    void otherUserCannotLoadCard() {
        when(cardRepository.findByIdAndDeckUserId(resourceId, otherId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> ownedAccess.requireCard(otherId, resourceId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Card not found", ex.getMessage());
    }

    @Test
    void otherUserCannotLoadMix() {
        when(mixRepository.findByIdAndUserId(resourceId, otherId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> ownedAccess.requireMix(otherId, resourceId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Study mix not found", ex.getMessage());
    }

    @Test
    void requireDecksFailsIfAnyIdIsNotOwned() {
        UUID ownedId = UUID.fromString("00000000-0000-0000-0000-0000000000b1");
        UUID foreignId = UUID.fromString("00000000-0000-0000-0000-0000000000b2");
        Deck owned = new Deck();
        when(deckRepository.findByIdInAndUser_Id(any(), eq(otherId))).thenReturn(List.of(owned));
        ApiException ex = assertThrows(
                ApiException.class, () -> ownedAccess.requireDecks(otherId, List.of(ownedId, foreignId)));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Deck not found", ex.getMessage());
    }

    @Test
    void requireSetsFailsIfAnyIdIsNotOwned() {
        UUID ownedId = UUID.fromString("00000000-0000-0000-0000-0000000000c1");
        UUID foreignId = UUID.fromString("00000000-0000-0000-0000-0000000000c2");
        DeckGroup owned = new DeckGroup();
        when(groupRepository.findByIdInAndUser_Id(any(), eq(otherId))).thenReturn(List.of(owned));
        ApiException ex = assertThrows(
                ApiException.class, () -> ownedAccess.requireSets(otherId, List.of(ownedId, foreignId)));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Set not found", ex.getMessage());
    }

    @Test
    void teacherCanLoadOwnClass() {
        StudyClass studyClass = classOwnedBy(ownerId);
        when(classRepository.findByIdAndTeacher_Id(resourceId, ownerId)).thenReturn(Optional.of(studyClass));
        assertSame(studyClass, ownedAccess.requireClassOwner(ownerId, resourceId));
    }

    @Test
    void otherUserCannotLoadClassAsOwner() {
        when(classRepository.findByIdAndTeacher_Id(resourceId, otherId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(
                ApiException.class, () -> ownedAccess.requireClassOwner(otherId, resourceId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Class not found", ex.getMessage());
    }

    @Test
    void otherUserCannotLoadClassAsMember() {
        when(classRepository.findVisible(resourceId, otherId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(
                ApiException.class, () -> ownedAccess.requireClassMember(otherId, resourceId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Class not found", ex.getMessage());
    }

    private static StudyClass classOwnedBy(UUID teacherId) {
        User teacher = new User();
        teacher.setId(teacherId);
        StudyClass studyClass = new StudyClass();
        studyClass.setTeacher(teacher);
        return studyClass;
    }
}
