package com.flashcards.agent;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class AgentCreditServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000021");

    @Mock
    private UserRepository userRepository;
    @Mock
    private AgentCreditLedgerRepository ledgerRepository;

    private AgentCreditService creditService;
    private User user;
    private final List<AgentCreditLedger> ledger = new ArrayList<>();

    @BeforeEach
    void setUp() {
        creditService = new AgentCreditService(
                userRepository, ledgerRepository, new AgentProperties("", "", "", 10, 10, 40, 90, 0, 0, 0, 0));
        user = new User();
        user.setId(USER_ID);
        user.setProLicensed(true);
        lenient().when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        lenient().when(userRepository.save(user)).thenReturn(user);
        lenient().when(ledgerRepository.save(any(AgentCreditLedger.class))).thenAnswer(invocation -> {
            AgentCreditLedger row = invocation.getArgument(0);
            ledger.add(row);
            return row;
        });
        lenient().when(ledgerRepository.existsByReasonAndProviderRef(any(), any())).thenAnswer(invocation -> {
            CreditReason reason = invocation.getArgument(0);
            String ref = invocation.getArgument(1);
            return ledger.stream().anyMatch(row -> row.getReason() == reason && ref.equals(row.getProviderRef()));
        });
        lenient().when(ledgerRepository.findByReasonAndProviderRef(any(), any())).thenAnswer(invocation -> {
            CreditReason reason = invocation.getArgument(0);
            String ref = invocation.getArgument(1);
            return ledger.stream()
                    .filter(row -> row.getReason() == reason && ref.equals(row.getProviderRef()))
                    .findFirst();
        });
    }

    @Test
    void grantsMonthlyIncludedCreditsForPro() {
        CreditBalance balance = creditService.snapshot(user);
        assertEquals(10, balance.includedCredits());
        assertEquals(0, balance.addonCredits());
        assertEquals(10, balance.remainingCredits());
        assertEquals(YearMonth.now(ZoneOffset.UTC).toString(), user.getAgentCreditPeriod());
    }

    @Test
    void resetsIncludedCreditsOnNewMonthAndKeepsAddon() {
        user.setAgentIncludedCredits(3);
        user.setAgentAddonCredits(12);
        user.setAgentCreditPeriod("2020-01");
        CreditBalance balance = creditService.snapshot(user);
        assertEquals(10, balance.includedCredits());
        assertEquals(12, balance.addonCredits());
        assertEquals(22, balance.remainingCredits());
    }

    @Test
    void consumeUsesIncludedCreditsBeforeAddon() {
        user.setAgentIncludedCredits(1);
        user.setAgentAddonCredits(5);
        user.setAgentCreditPeriod(YearMonth.now(ZoneOffset.UTC).toString());
        CreditBalance afterIncluded = creditService.consume(USER_ID);
        assertEquals(0, afterIncluded.includedCredits());
        assertEquals(5, afterIncluded.addonCredits());
        CreditBalance afterAddon = creditService.consume(USER_ID);
        assertEquals(0, afterAddon.includedCredits());
        assertEquals(4, afterAddon.addonCredits());
    }

    @Test
    void consumeFailsWhenEmpty() {
        user.setAgentCreditPeriod(YearMonth.now(ZoneOffset.UTC).toString());
        ApiException ex = assertThrows(ApiException.class, () -> creditService.consume(USER_ID));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertEquals("Out of AI credits", ex.getMessage());
    }

    @Test
    void addonPurchaseIsIdempotentForTheSameSession() {
        CreditBalance first = creditService.grantAddonPurchase(USER_ID, "cs_test_1");
        CreditBalance second = creditService.grantAddonPurchase(USER_ID, "cs_test_1");
        assertEquals(10, first.addonCredits());
        assertEquals(10, second.addonCredits());
    }

    @Test
    void capsIncludedCreditsWhenAllowanceDrops() {
        user.setAgentIncludedCredits(40);
        user.setAgentCreditPeriod(YearMonth.now(ZoneOffset.UTC).toString());
        CreditBalance balance = creditService.snapshot(user);
        assertEquals(10, balance.includedCredits());
        assertEquals(10, balance.remainingCredits());
    }

    @Test
    void refundRestoresIncludedCreditOnce() {
        UUID jobId = UUID.fromString("00000000-0000-0000-0000-0000000000aa");
        user.setAgentIncludedCredits(1);
        user.setAgentAddonCredits(4);
        user.setAgentCreditPeriod(YearMonth.now(ZoneOffset.UTC).toString());
        creditService.consume(USER_ID, jobId);
        CreditBalance afterRefund = creditService.refund(USER_ID, jobId);
        CreditBalance second = creditService.refund(USER_ID, jobId);
        assertEquals(1, afterRefund.includedCredits());
        assertEquals(4, afterRefund.addonCredits());
        assertEquals(1, second.includedCredits());
        assertEquals(4, second.addonCredits());
    }

    @Test
    void refundRestoresAddonCredit() {
        UUID jobId = UUID.fromString("00000000-0000-0000-0000-0000000000bb");
        user.setAgentIncludedCredits(0);
        user.setAgentAddonCredits(2);
        user.setAgentCreditPeriod(YearMonth.now(ZoneOffset.UTC).toString());
        creditService.consume(USER_ID, jobId);
        CreditBalance afterRefund = creditService.refund(USER_ID, jobId);
        assertEquals(0, afterRefund.includedCredits());
        assertEquals(2, afterRefund.addonCredits());
    }
}
