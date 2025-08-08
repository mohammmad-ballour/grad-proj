package com.grad.social.model.user;

public record MuteDuration(int amount, String unit) {
    //unit is: 'hours' | 'days' | 'months' | 'forever';
}
