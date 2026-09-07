package com.flashcards.csv;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.Test;

class CsvParserTest {

    @Test
    void parsesQuotedComma() throws Exception {
        String csv = "front,back\n\"hello, world\",hola\n";
        List<String[]> rows = CsvParser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));
        assertEquals(2, rows.size());
        assertArrayEquals(new String[] {"hello, world", "hola"}, rows.get(1));
    }

    @Test
    void parsesOptionalHintColumn() throws Exception {
        String csv = "front,back,hint\nhello,hola,greeting\nbye,adios\n";
        List<String[]> rows = CsvParser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));
        assertEquals(3, rows.size());
        assertArrayEquals(new String[] {"hello", "hola", "greeting"}, rows.get(1));
        assertArrayEquals(new String[] {"bye", "adios"}, rows.get(2));
    }

    @Test
    void escapesQuotesAndCommas() {
        assertEquals("\"say \"\"hi\"\"\"", CsvParser.escape("say \"hi\""));
        assertEquals("plain", CsvParser.escape("plain"));
    }
}
