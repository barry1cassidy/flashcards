package com.flashcards.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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

import com.flashcards.billing.BillingPlan;
import com.flashcards.billing.BillingService;
import com.flashcards.billing.UserSubscriptionRepository;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSubscriptionRepository subscriptionRepository;
    @Mock
    private BillingService billingService;

    private AdminService adminService;
    private final UUID adminId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final UUID memberId = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @BeforeEach
    void setUp() {
        adminService = new AdminService(userRepository, subscriptionRepository, billingService);
    }

    @Test
    void nonAdminCannotListUsers() {
        User member = new User();
        member.setId(memberId);
        member.setAdmin(false);
        when(userRepository.findById(memberId)).thenReturn(Optional.of(member));

        ApiException ex = assertThrows(ApiException.class, () -> adminService.listUsers(memberId, null));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("Admin required", ex.getMessage());
    }

    @Test
    void adminSeesUsersWithoutSecrets() {
        User admin = new User();
        admin.setId(adminId);
        admin.setAdmin(true);
        admin.setEmail("barry@zerve.io");
        admin.setDisplayName("Barry");
        admin.setGoogleSub("sub-123");
        admin.setPasswordHash("not-for-admin-views");
        User member = new User();
        member.setId(memberId);
        member.setEmail("student@example.com");
        member.setDisplayName("Student");
        when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(userRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(admin, member));
        when(subscriptionRepository.findAll()).thenReturn(List.of());

        List<AdminUserResponse> rows = adminService.listUsers(adminId, "  ");
        assertEquals(2, rows.size());
        assertEquals("GOOGLE", rows.get(0).signIn());
        assertEquals("PASSWORD", rows.get(1).signIn());
        assertTrue(rows.stream().noneMatch(row -> String.valueOf(row).contains("not-for-admin-views")));
        assertTrue(rows.stream().noneMatch(row -> String.valueOf(row).contains("sub-123")));
        verify(userRepository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void nonAdminCannotOpenAnotherUser() {
        User member = new User();
        member.setId(memberId);
        member.setAdmin(false);
        when(userRepository.findById(memberId)).thenReturn(Optional.of(member));

        ApiException ex = assertThrows(ApiException.class, () -> adminService.getUser(memberId, adminId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("Admin required", ex.getMessage());
        verify(userRepository, never()).findById(adminId);
        verify(subscriptionRepository, never()).findByUser_Id(adminId);
    }

    @Test
    void ownerCanOpenOwnSubscriptionDetails() {
        User member = new User();
        member.setId(memberId);
        member.setAdmin(false);
        member.setEmail("student@example.com");
        member.setDisplayName("Student");
        when(userRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(subscriptionRepository.findByUser_Id(memberId)).thenReturn(List.of());

        AdminUserResponse row = adminService.getUser(memberId, memberId);
        assertEquals(memberId, row.id());
        assertEquals("student@example.com", row.email());
        verify(userRepository, never()).findById(adminId);
    }

    @Test
    void adminCanOpenAnotherUsersSubscriptionDetails() {
        User admin = new User();
        admin.setId(adminId);
        admin.setAdmin(true);
        User member = new User();
        member.setId(memberId);
        member.setEmail("student@example.com");
        member.setDisplayName("Student");
        when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(userRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(subscriptionRepository.findByUser_Id(memberId)).thenReturn(List.of());

        AdminUserResponse row = adminService.getUser(adminId, memberId);
        assertEquals(memberId, row.id());
        assertEquals("student@example.com", row.email());
    }

    @Test
    void nonAdminCannotGrantSubscription() {
        User member = new User();
        member.setId(memberId);
        member.setAdmin(false);
        when(userRepository.findById(memberId)).thenReturn(Optional.of(member));

        ApiException ex = assertThrows(
                ApiException.class, () -> adminService.grantSubscription(memberId, adminId, BillingPlan.MONTHLY));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("Admin required", ex.getMessage());
        verify(billingService, never()).grantAdminSubscription(any(), any());
    }

    @Test
    void adminGrantDelegatesToBilling() {
        User admin = new User();
        admin.setId(adminId);
        admin.setAdmin(true);
        User member = new User();
        member.setId(memberId);
        member.setEmail("student@example.com");
        member.setDisplayName("Student");
        when(userRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(userRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(subscriptionRepository.findByUser_Id(memberId)).thenReturn(List.of());

        AdminUserResponse row = adminService.grantSubscription(adminId, memberId, BillingPlan.YEARLY);
        assertEquals(memberId, row.id());
        verify(billingService).grantAdminSubscription(memberId, BillingPlan.YEARLY);
    }

    @Test
    void nonAdminCannotCancelSubscription() {
        User member = new User();
        member.setId(memberId);
        member.setAdmin(false);
        when(userRepository.findById(memberId)).thenReturn(Optional.of(member));

        ApiException ex = assertThrows(ApiException.class, () -> adminService.cancelSubscription(memberId, adminId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(billingService, never()).cancelAdminSubscription(any());
    }
}
