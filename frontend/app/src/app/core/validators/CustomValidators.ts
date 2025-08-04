import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { COUNTRIES } from '../constants/countries.constant';

export class CustomValidators {
    static validTimezoneValidator(allTimezonesFlat: any): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const timezone = control.value;
            if (!timezone) return null;

            const isValid = allTimezonesFlat.includes(timezone);
            return isValid ? null : { invalidTimezone: true };
        };
    }

    static ageValidator(minAge: number, maxAge: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null;

            let birthDate: Date | null = null;
            const value = control.value;

            if (value instanceof Date) {
                birthDate = value;
            } else if (typeof value === 'string') {
                // Try MM/DD/YYYY
                const mdyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (mdyMatch) {
                    const month = +mdyMatch[1];
                    const day = +mdyMatch[2];
                    const year = +mdyMatch[3];
                    birthDate = new Date(Date.UTC(year, month - 1, day));
                    birthDate.setUTCFullYear(year);
                } else {
                    // Try YYYY-MM-DD
                    const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                    if (ymdMatch) {
                        const year = +ymdMatch[1];
                        const month = +ymdMatch[2];
                        const day = +ymdMatch[3];
                        birthDate = new Date(Date.UTC(year, month - 1, day));
                        birthDate.setUTCFullYear(year);
                    }
                }

                if (!birthDate || isNaN(birthDate.getTime())) {
                    return { invalidDate: true };
                }
            } else {
                return { invalidDate: true };
            }

            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const dayDiff = today.getDate() - birthDate.getDate();

            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                age--;
            }

            const currentYear = today.getFullYear();
            if (birthDate.getFullYear() > currentYear || birthDate.getFullYear() < currentYear - 120) {
                return { impossibleDate: true };
            }

            if (age < minAge || age > maxAge) {
                return { ageValidator: { min: minAge, max: maxAge, actual: age } };
            }

            return null;
        };
    }


}
