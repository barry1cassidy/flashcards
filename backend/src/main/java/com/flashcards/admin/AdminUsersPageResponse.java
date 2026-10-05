package com.flashcards.admin;

import java.util.List;

public record AdminUsersPageResponse(List<AdminUserResponse> users, int totalUsers, int totalPro) {
}
