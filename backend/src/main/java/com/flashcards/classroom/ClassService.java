package com.flashcards.classroom;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class ClassService {

    static final String CLASS_SET_COLOR = "#4C6FFF";

    private final ClassRepository classRepository;
    private final ClassMemberRepository memberRepository;
    private final ClassDeckRepository classDeckRepository;
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final DeckGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final DeckService deckService;
    private final OwnedAccess ownedAccess;
    private final SecureRandom random;

    @Autowired
    public ClassService(
            ClassRepository classRepository,
            ClassMemberRepository memberRepository,
            ClassDeckRepository classDeckRepository,
            DeckRepository deckRepository,
            CardRepository cardRepository,
            DeckGroupRepository groupRepository,
            UserRepository userRepository,
            DeckService deckService,
            OwnedAccess ownedAccess) {
        this(
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
    }

    ClassService(
            ClassRepository classRepository,
            ClassMemberRepository memberRepository,
            ClassDeckRepository classDeckRepository,
            DeckRepository deckRepository,
            CardRepository cardRepository,
            DeckGroupRepository groupRepository,
            UserRepository userRepository,
            DeckService deckService,
            OwnedAccess ownedAccess,
            SecureRandom random) {
        this.classRepository = classRepository;
        this.memberRepository = memberRepository;
        this.classDeckRepository = classDeckRepository;
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.deckService = deckService;
        this.ownedAccess = ownedAccess;
        this.random = random;
    }

    @Transactional(readOnly = true)
    public ClassListResponse list(UUID userId) {
        List<StudyClass> teaching = classRepository.findByTeacher_IdOrderByUpdatedAtDesc(userId);
        List<ClassMember> memberships = memberRepository.findByUser_IdOrderByJoinedAtDesc(userId);
        List<ClassSummary> teachingSummaries = teaching.stream()
                .map(studyClass -> toSummary(studyClass, "TEACHER"))
                .toList();
        List<ClassSummary> joinedSummaries = memberships.stream()
                .map(member -> toSummary(member.getStudyClass(), "STUDENT"))
                .toList();
        return new ClassListResponse(teachingSummaries, joinedSummaries);
    }

    @Transactional
    public ClassDetailResponse create(UUID userId, ClassRequest request) {
        User teacher = requireUser(userId);
        if (!teacher.isTeacherMode()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Teacher mode required");
        }
        StudyClass studyClass = new StudyClass();
        studyClass.setTeacher(teacher);
        studyClass.setName(request.name().trim());
        studyClass.setJoinCode(newJoinCode());
        classRepository.save(studyClass);
        return toDetail(studyClass, userId);
    }

    @Transactional(readOnly = true)
    public ClassDetailResponse get(UUID userId, UUID classId) {
        StudyClass studyClass = ownedAccess.requireClassMember(userId, classId);
        return toDetail(studyClass, userId);
    }

    @Transactional
    public ClassDetailResponse update(UUID userId, UUID classId, ClassRequest request) {
        StudyClass studyClass = ownedAccess.requireClassOwner(userId, classId);
        studyClass.setName(request.name().trim());
        return toDetail(studyClass, userId);
    }

    @Transactional
    public void delete(UUID userId, UUID classId) {
        StudyClass studyClass = ownedAccess.requireClassOwner(userId, classId);
        classRepository.delete(studyClass);
    }

    @Transactional
    public ClassDetailResponse regenerateJoinCode(UUID userId, UUID classId) {
        StudyClass studyClass = ownedAccess.requireClassOwner(userId, classId);
        studyClass.setJoinCode(newJoinCode());
        return toDetail(studyClass, userId);
    }

    @Transactional(readOnly = true)
    public ClassJoinPreview preview(String rawCode) {
        StudyClass studyClass = requireClassByCode(rawCode);
        return new ClassJoinPreview(
                studyClass.getName(),
                studyClass.getTeacher().getDisplayName(),
                studyClass.getJoinCode(),
                classDeckRepository.countByStudyClass_Id(studyClass.getId()),
                memberRepository.countByStudyClass_Id(studyClass.getId()));
    }

    @Transactional
    public ClassDetailResponse join(UUID userId, String rawCode) {
        StudyClass studyClass = requireClassByCode(rawCode);
        User user = requireUser(userId);
        if (ownedAccess.isClassOwner(studyClass, userId)
                || memberRepository.existsByStudyClass_IdAndUser_Id(studyClass.getId(), userId)) {
            return toDetail(studyClass, userId);
        }
        ClassMember member = new ClassMember();
        member.setStudyClass(studyClass);
        member.setUser(user);
        memberRepository.save(member);
        return toDetail(studyClass, userId);
    }

    @Transactional(readOnly = true)
    public ClassDetailResponse joinedByCode(UUID userId, String rawCode) {
        StudyClass studyClass = requireClassByCode(rawCode);
        if (ownedAccess.isClassOwner(studyClass, userId)
                || memberRepository.existsByStudyClass_IdAndUser_Id(studyClass.getId(), userId)) {
            return toDetail(studyClass, userId);
        }
        throw OwnedAccess.hidden("Class not found");
    }

    @Transactional
    public ClassDetailResponse assignDeck(UUID userId, UUID classId, UUID deckId) {
        StudyClass studyClass = ownedAccess.requireClassOwner(userId, classId);
        Deck deck = ownedAccess.requireDeck(userId, deckId);
        if (classDeckRepository.existsByStudyClass_IdAndDeck_Id(classId, deckId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Deck already assigned");
        }
        ClassDeck assignment = new ClassDeck();
        assignment.setStudyClass(studyClass);
        assignment.setDeck(deck);
        classDeckRepository.save(assignment);
        return toDetail(studyClass, userId);
    }

    @Transactional
    public ClassDetailResponse unassignDeck(UUID userId, UUID classId, UUID deckId) {
        StudyClass studyClass = ownedAccess.requireClassOwner(userId, classId);
        ClassDeck assignment = classDeckRepository
                .findByStudyClass_IdAndDeck_Id(classId, deckId)
                .orElseThrow(() -> OwnedAccess.hidden("Deck not found"));
        classDeckRepository.delete(assignment);
        return toDetail(studyClass, userId);
    }

    @Transactional
    public ClassDetailResponse removeMember(UUID userId, UUID classId, UUID memberId) {
        StudyClass studyClass = ownedAccess.requireClassOwner(userId, classId);
        ClassMember member = memberRepository
                .findByStudyClass_IdAndUser_Id(classId, memberId)
                .orElseThrow(() -> OwnedAccess.hidden("Class not found"));
        memberRepository.delete(member);
        return toDetail(studyClass, userId);
    }

    @Transactional
    public void leave(UUID userId, UUID classId) {
        StudyClass studyClass = ownedAccess.requireClassMember(userId, classId);
        if (ownedAccess.isClassOwner(studyClass, userId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Teachers cannot leave their class");
        }
        memberRepository.deleteByStudyClass_IdAndUser_Id(classId, userId);
    }

    @Transactional
    public DeckResponse copyAssignedDeck(UUID userId, UUID classId, UUID deckId) {
        StudyClass studyClass = ownedAccess.requireClassMember(userId, classId);
        Deck master = requireAssignedMaster(classId, deckId);
        if (ownedAccess.isClassOwner(studyClass, userId)) {
            return deckService.get(userId, master.getId());
        }
        return deckRepository
                .findByUser_IdAndClassSourceDeckId(userId, master.getId())
                .map(existing -> deckService.get(userId, existing.getId()))
                .orElseGet(() -> copyMaster(userId, studyClass, master));
    }

    @Transactional
    public DeckResponse updateFromClass(UUID userId, UUID classId, UUID deckId) {
        ownedAccess.requireClassMember(userId, classId);
        Deck master = requireAssignedMaster(classId, deckId);
        Deck copy = deckRepository
                .findByUser_IdAndClassSourceDeckId(userId, master.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Add this deck to My Decks first"));
        List<Card> masterCards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(master.getId());
        List<Card> copyCards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(copy.getId());
        Map<UUID, Card> bySource = new HashMap<>();
        List<Card> toDelete = new ArrayList<>();
        for (Card card : copyCards) {
            if (card.getSourceCardId() == null) {
                continue;
            }
            bySource.put(card.getSourceCardId(), card);
        }
        Set<UUID> masterIds = new HashSet<>();
        List<Card> toAdd = new ArrayList<>();
        for (Card source : masterCards) {
            masterIds.add(source.getId());
            Card existing = bySource.get(source.getId());
            if (existing == null) {
                Card card = new Card();
                card.setDeck(copy);
                card.setFront(source.getFront());
                card.setBack(source.getBack());
                card.setHint(source.getHint());
                card.setPosition(source.getPosition());
                card.setSourceCardId(source.getId());
                toAdd.add(card);
            } else {
                existing.setFront(source.getFront());
                existing.setBack(source.getBack());
                existing.setHint(source.getHint());
                existing.setPosition(source.getPosition());
            }
        }
        for (Card card : copyCards) {
            if (card.getSourceCardId() != null && !masterIds.contains(card.getSourceCardId())) {
                toDelete.add(card);
            }
        }
        if (!toDelete.isEmpty()) {
            cardRepository.deleteAll(toDelete);
        }
        if (!toAdd.isEmpty()) {
            cardRepository.saveAll(toAdd);
        }
        copy.setName(master.getName());
        copy.setDescription(master.getDescription());
        copy.setFrontLanguage(master.getFrontLanguage());
        copy.setBackLanguage(master.getBackLanguage());
        copy.setClassSyncedAt(Instant.now());
        return deckService.toResponse(copy, deckService.statsFor(copy));
    }

    private DeckResponse copyMaster(UUID userId, StudyClass studyClass, Deck master) {
        User user = requireUser(userId);
        DeckGroup group = groupRepository
                .findByUser_IdAndNameIgnoreCase(userId, studyClass.getName())
                .orElseGet(() -> {
                    DeckGroup created = new DeckGroup();
                    created.setUser(user);
                    created.setName(studyClass.getName());
                    created.setColor(CLASS_SET_COLOR);
                    return groupRepository.save(created);
                });
        Deck copy = new Deck();
        copy.setUser(user);
        copy.setName(master.getName());
        copy.setDescription(master.getDescription());
        copy.setGroup(group);
        copy.setFrontLanguage(master.getFrontLanguage());
        copy.setBackLanguage(master.getBackLanguage());
        copy.setClassSourceDeckId(master.getId());
        copy.setClassSyncedAt(Instant.now());
        deckRepository.save(copy);
        List<Card> sourceCards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(master.getId());
        List<Card> cards = new ArrayList<>();
        for (Card source : sourceCards) {
            Card card = new Card();
            card.setDeck(copy);
            card.setFront(source.getFront());
            card.setBack(source.getBack());
            card.setHint(source.getHint());
            card.setPosition(source.getPosition());
            card.setSourceCardId(source.getId());
            cards.add(card);
        }
        cardRepository.saveAll(cards);
        return deckService.toResponse(copy, deckService.statsFor(copy));
    }

    private Deck requireAssignedMaster(UUID classId, UUID deckId) {
        return classDeckRepository
                .findByStudyClass_IdAndDeck_Id(classId, deckId)
                .map(ClassDeck::getDeck)
                .orElseThrow(() -> OwnedAccess.hidden("Deck not found"));
    }

    private StudyClass requireClassByCode(String rawCode) {
        String code = JoinCodes.normalize(rawCode);
        if (!JoinCodes.isWellFormed(code)) {
            throw OwnedAccess.hidden("Class not found");
        }
        return classRepository.findByJoinCode(code).orElseThrow(() -> OwnedAccess.hidden("Class not found"));
    }

    private User requireUser(UUID userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }

    private String newJoinCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = JoinCodes.random(random);
            if (!classRepository.existsByJoinCode(code)) {
                return code;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create a join code");
    }

    private ClassSummary toSummary(StudyClass studyClass, String role) {
        return new ClassSummary(
                studyClass.getId(),
                studyClass.getName(),
                role,
                "TEACHER".equals(role) ? studyClass.getJoinCode() : null,
                studyClass.getTeacher().getDisplayName(),
                memberRepository.countByStudyClass_Id(studyClass.getId()),
                classDeckRepository.countByStudyClass_Id(studyClass.getId()),
                studyClass.getCreatedAt(),
                studyClass.getUpdatedAt());
    }

    private ClassDetailResponse toDetail(StudyClass studyClass, UUID viewerId) {
        boolean teacher = ownedAccess.isClassOwner(studyClass, viewerId);
        List<ClassDeck> assignments = classDeckRepository.findByStudyClass_IdOrderByAssignedAtAsc(studyClass.getId());
        List<UUID> masterIds = assignments.stream().map(assignment -> assignment.getDeck().getId()).toList();
        Map<UUID, Deck> copies = copiesFor(viewerId, masterIds);
        List<ClassAssignedDeck> decks = assignments.stream()
                .map(assignment -> toAssignedDeck(assignment.getDeck(), copies.get(assignment.getDeck().getId())))
                .toList();
        List<ClassMemberProgress> members = teacher ? memberProgress(studyClass.getId(), assignments) : List.of();
        return new ClassDetailResponse(
                studyClass.getId(),
                studyClass.getName(),
                teacher ? "TEACHER" : "STUDENT",
                teacher ? studyClass.getJoinCode() : null,
                studyClass.getTeacher().getDisplayName(),
                studyClass.getTeacher().getId(),
                memberRepository.countByStudyClass_Id(studyClass.getId()),
                studyClass.getCreatedAt(),
                studyClass.getUpdatedAt(),
                decks,
                members);
    }

    private List<ClassMemberProgress> memberProgress(UUID classId, List<ClassDeck> assignments) {
        List<ClassMember> members = memberRepository.findByStudyClass_IdOrderByJoinedAtAsc(classId);
        List<UUID> masterIds = assignments.stream().map(assignment -> assignment.getDeck().getId()).toList();
        List<ClassMemberProgress> rows = new ArrayList<>();
        for (ClassMember member : members) {
            Map<UUID, Deck> copies = copiesFor(member.getUser().getId(), masterIds);
            List<ClassMemberDeckProgress> decks = new ArrayList<>();
            for (ClassDeck assignment : assignments) {
                Deck master = assignment.getDeck();
                Deck copy = copies.get(master.getId());
                DeckStats stats = copy == null ? null : deckService.statsFor(copy);
                decks.add(new ClassMemberDeckProgress(
                        master.getId(),
                        master.getName(),
                        copy != null,
                        stats == null ? null : stats.lastStudiedAt(),
                        stats == null ? 0 : stats.dueCount(),
                        stats == null ? 0 : stats.learnedCount()));
            }
            rows.add(new ClassMemberProgress(
                    member.getUser().getId(),
                    member.getUser().getDisplayName(),
                    member.getUser().getEmail(),
                    member.getJoinedAt(),
                    decks));
        }
        return rows;
    }

    private ClassAssignedDeck toAssignedDeck(Deck master, Deck copy) {
        long cardCount = cardRepository.countByDeckId(master.getId());
        DeckStats stats = copy == null ? null : deckService.statsFor(copy);
        return new ClassAssignedDeck(
                master.getId(),
                master.getName(),
                master.getDescription(),
                cardCount,
                copy == null ? null : copy.getId(),
                copy != null && needsUpdate(master, copy),
                stats == null ? null : stats.lastStudiedAt(),
                stats == null ? 0 : stats.dueCount(),
                stats == null ? 0 : stats.learnedCount());
    }

    boolean needsUpdate(Deck master, Deck copy) {
        List<Card> masterCards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(master.getId());
        List<Card> copyCards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(copy.getId());
        Map<UUID, Card> bySource = copyCards.stream()
                .filter(card -> card.getSourceCardId() != null)
                .collect(Collectors.toMap(Card::getSourceCardId, card -> card, (left, right) -> left));
        if (bySource.size() != masterCards.size()) {
            return true;
        }
        for (Card source : masterCards) {
            Card match = bySource.get(source.getId());
            if (match == null || !sameContent(source, match)) {
                return true;
            }
        }
        return false;
    }

    static boolean sameContent(Card master, Card copy) {
        return Objects.equals(master.getFront(), copy.getFront())
                && Objects.equals(master.getBack(), copy.getBack())
                && Objects.equals(master.getHint(), copy.getHint())
                && master.getPosition() == copy.getPosition();
    }

    private Map<UUID, Deck> copiesFor(UUID userId, List<UUID> masterIds) {
        if (userId == null || masterIds.isEmpty()) {
            return Map.of();
        }
        return deckRepository.findByUser_IdAndClassSourceDeckIdIn(userId, masterIds).stream()
                .filter(deck -> deck.getClassSourceDeckId() != null)
                .collect(Collectors.toMap(Deck::getClassSourceDeckId, deck -> deck, (left, right) -> left));
    }
}
