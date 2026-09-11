package com.flashcards.classroom;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.flashcards.card.Card;
import com.flashcards.card.CardRepository;
import com.flashcards.common.ApiException;
import com.flashcards.deck.Deck;
import com.flashcards.deck.DeckRepository;
import com.flashcards.deck.DeckResponse;
import com.flashcards.deck.DeckService;
import com.flashcards.deck.DeckService.DeckStats;
import com.flashcards.group.DeckGroup;
import com.flashcards.group.DeckGroupRepository;
import com.flashcards.mix.StudyMixRepository;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class ClassServiceTest {

    @Mock
    private ClassRepository classRepository;
    @Mock
    private ClassMemberRepository memberRepository;
    @Mock
    private ClassDeckRepository classDeckRepository;
    @Mock
    private DeckRepository deckRepository;
    @Mock
    private CardRepository cardRepository;
    @Mock
    private DeckGroupRepository groupRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DeckService deckService;
    @Mock
    private StudyMixRepository mixRepository;

    private ClassService classService;

    private final UUID teacherId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private final UUID strangerId = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private final UUID classId = UUID.fromString("00000000-0000-0000-0000-0000000000aa");
    private final UUID deckId = UUID.fromString("00000000-0000-0000-0000-0000000000bb");
    private final UUID copyId = UUID.fromString("00000000-0000-0000-0000-0000000000cc");
    private final UUID masterCardId = UUID.fromString("00000000-0000-0000-0000-0000000000d1");
    private final UUID removedCardId = UUID.fromString("00000000-0000-0000-0000-0000000000d2");
    private final UUID newCardId = UUID.fromString("00000000-0000-0000-0000-0000000000d3");

    private User teacher;
    private User student;
    private StudyClass studyClass;

    @BeforeEach
    void setUp() {
        OwnedAccess ownedAccess = new OwnedAccess(
                deckRepository, groupRepository, cardRepository, mixRepository, classRepository, memberRepository);
        classService = new ClassService(
                classRepository,
                memberRepository,
                classDeckRepository,
                deckRepository,
                cardRepository,
                groupRepository,
                userRepository,
                deckService,
                ownedAccess,
                new SecureRandom());
        teacher = user(teacherId, "Ms. Park", "park@school.edu", true);
        student = user(studentId, "Alex", "alex@student.edu", false);
        studyClass = classroom(teacher);
    }

    @Test
    void createRequiresTeacherMode() {
        teacher.setTeacherMode(false);
        when(userRepository.findById(teacherId)).thenReturn(Optional.of(teacher));
        ApiException ex = assertThrows(
                ApiException.class, () -> classService.create(teacherId, new ClassRequest("Period 3 Spanish")));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("Teacher mode required", ex.getMessage());
        verify(classRepository, never()).save(any());
    }

    @Test
    void createSucceedsWhenTeacherModeIsOn() {
        when(userRepository.findById(teacherId)).thenReturn(Optional.of(teacher));
        when(classRepository.existsByJoinCode(any())).thenReturn(false);
        when(classRepository.save(any(StudyClass.class))).thenAnswer(invocation -> {
            StudyClass saved = invocation.getArgument(0);
            saved.setId(classId);
            saved.setCreatedAt(Instant.parse("2026-09-10T12:00:00Z"));
            saved.setUpdatedAt(saved.getCreatedAt());
            return saved;
        });
        stubEmptyDetail();

        ClassDetailResponse response = classService.create(teacherId, new ClassRequest("Period 3 Spanish"));

        assertEquals(classId, response.id());
        assertEquals("Period 3 Spanish", response.name());
        assertEquals("TEACHER", response.role());
        assertEquals(6, response.joinCode().length());
        assertTrue(JoinCodes.isWellFormed(response.joinCode()));
        assertTrue(response.members().isEmpty());
    }

    @Test
    void strangerCannotGetClass() {
        when(classRepository.findVisible(classId, strangerId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> classService.get(strangerId, classId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Class not found", ex.getMessage());
    }

    @Test
    void joinByCodeAddsMember() {
        when(classRepository.findByJoinCode("K7M2QX")).thenReturn(Optional.of(studyClass));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(memberRepository.existsByStudyClass_IdAndUser_Id(classId, studentId)).thenReturn(false);
        when(memberRepository.save(any(ClassMember.class))).thenAnswer(invocation -> invocation.getArgument(0));
        stubEmptyDetail();

        ClassDetailResponse response = classService.join(studentId, "k7m2qx");

        ArgumentCaptor<ClassMember> saved = ArgumentCaptor.forClass(ClassMember.class);
        verify(memberRepository).save(saved.capture());
        assertEquals(studentId, saved.getValue().getUser().getId());
        assertEquals(classId, saved.getValue().getStudyClass().getId());
        assertEquals("STUDENT", response.role());
        assertNull(response.joinCode());
    }

    @Test
    void joinWithBadCodeIsHidden() {
        ApiException malformed = assertThrows(ApiException.class, () -> classService.join(studentId, "nope"));
        assertEquals(HttpStatus.NOT_FOUND, malformed.getStatus());
        assertEquals("Class not found", malformed.getMessage());

        when(classRepository.findByJoinCode("K7M2QX")).thenReturn(Optional.empty());
        ApiException missing = assertThrows(ApiException.class, () -> classService.join(studentId, "K7M2QX"));
        assertEquals(HttpStatus.NOT_FOUND, missing.getStatus());
        assertEquals("Class not found", missing.getMessage());
    }

    @Test
    void assignRequiresOwningTheDeck() {
        when(classRepository.findByIdAndTeacher_Id(classId, teacherId)).thenReturn(Optional.of(studyClass));
        when(deckRepository.findByIdAndUserId(deckId, teacherId)).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> classService.assignDeck(teacherId, classId, deckId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Deck not found", ex.getMessage());
        verify(classDeckRepository, never()).save(any());
    }

    @Test
    void assignSucceedsForOwnedDeck() {
        Deck master = masterDeck();
        when(classRepository.findByIdAndTeacher_Id(classId, teacherId)).thenReturn(Optional.of(studyClass));
        when(deckRepository.findByIdAndUserId(deckId, teacherId)).thenReturn(Optional.of(master));
        when(classDeckRepository.existsByStudyClass_IdAndDeck_Id(classId, deckId)).thenReturn(false);
        when(classDeckRepository.save(any(ClassDeck.class))).thenAnswer(invocation -> invocation.getArgument(0));
        stubEmptyDetail();

        ClassDetailResponse response = classService.assignDeck(teacherId, classId, deckId);
        assertEquals("TEACHER", response.role());
        verify(classDeckRepository).save(any(ClassDeck.class));
    }

    @Test
    void copyCreatesOwnedDeckWithSourceIds() {
        Deck master = masterDeck();
        Card source = card(master, masterCardId, "hola", "hello", 0);
        when(classRepository.findVisible(classId, studentId)).thenReturn(Optional.of(studyClass));
        when(classDeckRepository.findByStudyClass_IdAndDeck_Id(classId, deckId))
                .thenReturn(Optional.of(assignment(master)));
        when(deckRepository.findByUser_IdAndClassSourceDeckId(studentId, deckId)).thenReturn(Optional.empty());
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(groupRepository.findByUser_IdAndNameIgnoreCase(studentId, "Period 3 Spanish")).thenReturn(Optional.empty());
        when(groupRepository.save(any(DeckGroup.class))).thenAnswer(invocation -> {
            DeckGroup group = invocation.getArgument(0);
            group.setId(UUID.fromString("00000000-0000-0000-0000-0000000000ee"));
            return group;
        });
        when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> {
            Deck saved = invocation.getArgument(0);
            saved.setId(copyId);
            return saved;
        });
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of(source));
        when(cardRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        DeckResponse copied = deckResponse(copyId);
        when(deckService.statsFor(any(Deck.class))).thenReturn(new DeckStats(1, 1, 0, null, 0, 0));
        when(deckService.toResponse(any(Deck.class), any())).thenReturn(copied);

        DeckResponse response = classService.copyAssignedDeck(studentId, classId, deckId);

        assertEquals(copyId, response.id());
        ArgumentCaptor<Deck> savedDeck = ArgumentCaptor.forClass(Deck.class);
        verify(deckRepository).save(savedDeck.capture());
        assertEquals(studentId, savedDeck.getValue().getUser().getId());
        assertEquals(deckId, savedDeck.getValue().getClassSourceDeckId());
        assertEquals("Period 3 Spanish", savedDeck.getValue().getGroup().getName());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Card>> savedCards = ArgumentCaptor.forClass(List.class);
        verify(cardRepository).saveAll(savedCards.capture());
        assertEquals(1, savedCards.getValue().size());
        assertEquals(masterCardId, savedCards.getValue().get(0).getSourceCardId());
        assertEquals("hola", savedCards.getValue().get(0).getFront());
    }

    @Test
    void secondCopyReturnsExistingDeck() {
        Deck master = masterDeck();
        Deck existing = new Deck();
        existing.setId(copyId);
        existing.setUser(student);
        existing.setClassSourceDeckId(deckId);
        when(classRepository.findVisible(classId, studentId)).thenReturn(Optional.of(studyClass));
        when(classDeckRepository.findByStudyClass_IdAndDeck_Id(classId, deckId))
                .thenReturn(Optional.of(assignment(master)));
        when(deckRepository.findByUser_IdAndClassSourceDeckId(studentId, deckId)).thenReturn(Optional.of(existing));
        DeckResponse copied = deckResponse(copyId);
        when(deckService.get(studentId, copyId)).thenReturn(copied);

        DeckResponse response = classService.copyAssignedDeck(studentId, classId, deckId);

        assertSame(copied, response);
        verify(deckRepository, never()).save(any());
    }

    @Test
    void updateFromClassAddsRemovesAndEditsCardsWithoutDroppingKeptOnes() {
        Deck master = masterDeck();
        Deck copy = new Deck();
        copy.setId(copyId);
        copy.setUser(student);
        copy.setClassSourceDeckId(deckId);
        Card keptMaster = card(master, masterCardId, "hola!", "hello", 0);
        Card addedMaster = card(master, newCardId, "adios", "goodbye", 1);
        Card keptCopy = card(copy, UUID.fromString("00000000-0000-0000-0000-0000000000e1"), "hola", "hello", 0);
        keptCopy.setSourceCardId(masterCardId);
        Card removedCopy = card(copy, UUID.fromString("00000000-0000-0000-0000-0000000000e2"), "old", "gone", 1);
        removedCopy.setSourceCardId(removedCardId);
        Card studentOnly = card(copy, UUID.fromString("00000000-0000-0000-0000-0000000000e3"), "mine", "nota", 2);

        when(classRepository.findVisible(classId, studentId)).thenReturn(Optional.of(studyClass));
        when(classDeckRepository.findByStudyClass_IdAndDeck_Id(classId, deckId))
                .thenReturn(Optional.of(assignment(master)));
        when(deckRepository.findByUser_IdAndClassSourceDeckId(studentId, deckId)).thenReturn(Optional.of(copy));
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of(keptMaster, addedMaster));
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(copyId))
                .thenReturn(List.of(keptCopy, removedCopy, studentOnly));
        when(cardRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(deckService.statsFor(copy)).thenReturn(new DeckStats(3, 1, 1, Instant.parse("2026-09-01T00:00:00Z"), 0, 0));
        when(deckService.toResponse(eq(copy), any())).thenReturn(deckResponse(copyId));

        classService.updateFromClass(studentId, classId, deckId);

        assertEquals("hola!", keptCopy.getFront());
        assertEquals(0, keptCopy.getPosition());
        verify(cardRepository).deleteAll(List.of(removedCopy));
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Card>> added = ArgumentCaptor.forClass(List.class);
        verify(cardRepository).saveAll(added.capture());
        assertEquals(1, added.getValue().size());
        assertEquals(newCardId, added.getValue().get(0).getSourceCardId());
        assertEquals("adios", added.getValue().get(0).getFront());
        assertEquals("mine", studentOnly.getFront());
        verify(cardRepository, never()).deleteAll(List.of(studentOnly));
        verify(cardRepository, never()).deleteAll(List.of(keptCopy));
    }

    @Test
    void studentIsNotClassOwnerAndCanSeeAssignments() {
        Deck master = masterDeck();
        when(classRepository.findVisible(classId, studentId)).thenReturn(Optional.of(studyClass));
        when(classDeckRepository.findByStudyClass_IdOrderByAssignedAtAsc(classId))
                .thenReturn(List.of(assignment(master)));
        when(deckRepository.findByUser_IdAndClassSourceDeckIdIn(eq(studentId), anyCollection()))
                .thenReturn(List.of());
        when(cardRepository.countByDeckId(deckId)).thenReturn(4);
        when(memberRepository.countByStudyClass_Id(classId)).thenReturn(1L);

        ClassDetailResponse response = classService.get(studentId, classId);

        assertEquals("STUDENT", response.role());
        assertNull(response.joinCode());
        assertTrue(response.members().isEmpty());
        assertEquals(1, response.decks().size());
        assertEquals(deckId, response.decks().get(0).deckId());
        assertEquals(4, response.decks().get(0).cardCount());
        assertNull(response.decks().get(0).copiedDeckId());
        assertFalse(response.decks().get(0).needsUpdate());
    }

    @Test
    void teacherSeesMemberProgress() {
        Deck master = masterDeck();
        Deck copy = new Deck();
        copy.setId(copyId);
        copy.setUser(student);
        copy.setClassSourceDeckId(deckId);
        ClassMember membership = new ClassMember();
        membership.setStudyClass(studyClass);
        membership.setUser(student);
        membership.setJoinedAt(Instant.parse("2026-09-08T15:00:00Z"));
        Instant lastStudied = Instant.parse("2026-09-10T18:00:00Z");
        when(classRepository.findVisible(classId, teacherId)).thenReturn(Optional.of(studyClass));
        when(classDeckRepository.findByStudyClass_IdOrderByAssignedAtAsc(classId))
                .thenReturn(List.of(assignment(master)));
        when(deckRepository.findByUser_IdAndClassSourceDeckIdIn(eq(teacherId), anyCollection()))
                .thenReturn(List.of());
        when(cardRepository.countByDeckId(deckId)).thenReturn(2);
        when(memberRepository.countByStudyClass_Id(classId)).thenReturn(1L);
        when(memberRepository.findByStudyClass_IdOrderByJoinedAtAsc(classId)).thenReturn(List.of(membership));
        when(deckRepository.findByUser_IdAndClassSourceDeckIdIn(eq(studentId), anyCollection()))
                .thenReturn(List.of(copy));
        when(deckService.statsFor(copy)).thenReturn(new DeckStats(2, 1, 1, lastStudied, 0, 0));

        ClassDetailResponse response = classService.get(teacherId, classId);

        assertEquals("TEACHER", response.role());
        assertEquals("K7M2QX", response.joinCode());
        assertEquals(1, response.members().size());
        ClassMemberProgress row = response.members().get(0);
        assertEquals(studentId, row.userId());
        assertEquals("alex@student.edu", row.email());
        assertEquals(1, row.decks().size());
        assertTrue(row.decks().get(0).copied());
        assertEquals(lastStudied, row.decks().get(0).lastStudiedAt());
        assertEquals(1, row.decks().get(0).dueCount());
        assertEquals(1, row.decks().get(0).learnedCount());
    }

    private void stubEmptyDetail() {
        when(classDeckRepository.findByStudyClass_IdOrderByAssignedAtAsc(classId)).thenReturn(List.of());
        when(memberRepository.countByStudyClass_Id(classId)).thenReturn(0L);
    }

    private StudyClass classroom(User owner) {
        StudyClass created = new StudyClass();
        created.setId(classId);
        created.setTeacher(owner);
        created.setName("Period 3 Spanish");
        created.setJoinCode("K7M2QX");
        created.setCreatedAt(Instant.parse("2026-09-01T00:00:00Z"));
        created.setUpdatedAt(created.getCreatedAt());
        return created;
    }

    private Deck masterDeck() {
        Deck deck = new Deck();
        deck.setId(deckId);
        deck.setUser(teacher);
        deck.setName("Greetings");
        deck.setDescription("Unit 1");
        deck.setFrontLanguage("es");
        deck.setBackLanguage("en");
        return deck;
    }

    private ClassDeck assignment(Deck master) {
        ClassDeck assignment = new ClassDeck();
        assignment.setStudyClass(studyClass);
        assignment.setDeck(master);
        return assignment;
    }

    private static Card card(Deck deck, UUID id, String front, String back, int position) {
        Card card = new Card();
        card.setId(id);
        card.setDeck(deck);
        card.setFront(front);
        card.setBack(back);
        card.setPosition(position);
        return card;
    }

    private static User user(UUID id, String name, String email, boolean teacherMode) {
        User user = new User();
        user.setId(id);
        user.setDisplayName(name);
        user.setEmail(email);
        user.setTeacherMode(teacherMode);
        return user;
    }

    private static DeckResponse deckResponse(UUID id) {
        return new DeckResponse(id, "Greetings", "Unit 1", null, "es", "en", null, null, 1, 1, 0, null, 0, 0);
    }
}
