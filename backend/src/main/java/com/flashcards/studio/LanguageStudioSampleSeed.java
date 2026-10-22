package com.flashcards.studio;

import java.io.InputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class LanguageStudioSampleSeed implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LanguageStudioSampleSeed.class);
    private static final String CATALOG = "studio/samples.json";

    private final StudioSampleSceneRepository sceneRepository;
    private final ObjectMapper objectMapper;

    public LanguageStudioSampleSeed(StudioSampleSceneRepository sceneRepository, ObjectMapper objectMapper) {
        this.sceneRepository = sceneRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        ClassPathResource resource = new ClassPathResource(CATALOG);
        if (!resource.exists()) {
            log.warn("Language Studio sample catalog is missing; skipping {}", CATALOG);
            return;
        }
        try (InputStream stream = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(stream);
            int scenes = 0;
            int turns = 0;
            for (JsonNode sceneNode : root.path("scenes")) {
                Seeded seeded = seedScene(sceneNode);
                scenes += 1;
                turns += seeded.turns();
            }
            log.info("Seeded Language Studio samples: {} scenes, {} turns", scenes, turns);
        }
    }

    private Seeded seedScene(JsonNode sceneNode) {
        String slug = sceneNode.path("slug").asText();
        StudioSampleScene scene = sceneRepository.findBySlug(slug).orElseGet(StudioSampleScene::new);
        scene.setSlug(slug);
        scene.setScenario(sceneNode.path("scenario").asText(slug));
        scene.setLevel(LanguageLevel.from(sceneNode.path("level").asText("A2")));
        scene.setPosition(sceneNode.path("position").asInt(0));
        scene.getTexts().clear();
        scene.getTurns().clear();
        sceneRepository.save(scene);

        JsonNode meta = sceneNode.path("meta");
        for (String language : StudioSampleLanguages.CODES) {
            JsonNode entry = meta.path(language);
            if (!entry.isObject()) {
                continue;
            }
            StudioSampleI18n row = new StudioSampleI18n();
            StudioSampleI18nId id = new StudioSampleI18nId();
            id.setSceneId(scene.getId());
            id.setLanguage(language);
            row.setId(id);
            row.setScene(scene);
            row.setTitle(entry.path("title").asText());
            row.setYourRole(entry.path("yourRole").asText());
            row.setTheirRole(entry.path("theirRole").asText());
            scene.getTexts().add(row);
        }

        int position = 0;
        JsonNode speakers = sceneNode.path("speakers");
        for (JsonNode turnNode : sceneNode.path("turns")) {
            StudioSampleTurn turn = new StudioSampleTurn();
            turn.setScene(scene);
            turn.setPosition(position++);
            turn.setRole(LanguageTurnRole.from(turnNode.path("role").asText()));
            scene.getTurns().add(turn);
            JsonNode lines = turnNode.path("lines");
            for (String language : StudioSampleLanguages.CODES) {
                JsonNode text = lines.path(language);
                if (text.isMissingNode() || text.isNull() || text.asText("").isBlank()) {
                    continue;
                }
                StudioSampleLine line = new StudioSampleLine();
                StudioSampleLineId id = new StudioSampleLineId();
                id.setLanguage(language);
                line.setId(id);
                line.setTurn(turn);
                line.setSpeaker(speakerName(speakers, turn.getRole(), language));
                line.setLine(text.asText());
                turn.getLines().add(line);
            }
        }
        sceneRepository.save(scene);
        return new Seeded(position);
    }

    private static String speakerName(JsonNode speakers, LanguageTurnRole role, String language) {
        String key = role == LanguageTurnRole.YOU ? "you" : "them";
        String named = speakers.path(key).path(language).asText("");
        if (!named.isBlank()) {
            return named;
        }
        named = speakers.path(key).path(StudioSampleLanguages.ENGLISH).asText("");
        if (!named.isBlank()) {
            return named;
        }
        return role == LanguageTurnRole.YOU ? "You" : "Them";
    }

    private record Seeded(int turns) {
    }
}
