package com.flashcards.billing;

import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.billing.zipconvo")
public record ZipconvoStoreProperties(String googlePackageName, String appleBundleId) {

    public List<String> googlePackages(String primary) {
        LinkedHashSet<String> names = new LinkedHashSet<>();
        add(names, primary);
        add(names, googlePackageName);
        return List.copyOf(names);
    }

    public boolean acceptsAppleBundle(String primary, String bundleId) {
        if (bundleId == null || bundleId.isBlank()) {
            return false;
        }
        String id = bundleId.trim();
        if (primary != null && id.equals(primary.trim())) {
            return true;
        }
        return appleBundleId != null && id.equals(appleBundleId.trim());
    }

    private static void add(LinkedHashSet<String> names, String value) {
        if (value != null && !value.isBlank()) {
            names.add(value.trim());
        }
    }
}
