import { inject, Injectable } from "@angular/core";
import { LotoBoxService } from "./loto-box.service";
import { LotoBoxStatus } from "../models/loto-box.model";

@Injectable({
    providedIn: 'root'
})

export class SpellingService{
    boxService = inject(LotoBoxService);

    spellString(str: string, delay = 3000): void {
        const letters = str.toUpperCase().split('');
        let currentIndex = 0;

        const displayNextLetter = () => {
            if (currentIndex >= letters.length) {
                console.log('Finished spelling:', str);
                return;
            }

            const letter = letters[currentIndex];
            console.log(`Displaying letter: ${letter}`);

            switch (letter) {
                case 'A':
                    this.setBoxesForA();
                    break;
                case 'B':
                    this.setBoxesForB();
                    break;
                default:
                    console.warn(`Letter ${letter} not implemented`);
            }

            currentIndex++;
            setTimeout(displayNextLetter, delay);
        };

        displayNextLetter();
    }
    
    setBoxesForA(): void {
        /**
         * Letter A pattern on 6x12 grid (72 boxes)
         * Boxes 1-72 arranged as:
         * Row 1: 1-12
         * Row 2: 13-24
         * Row 3: 25-36
         * Row 4: 37-48
         * Row 5: 49-60
         * Row 6: 61-72
         */

        const litBoxes = [
            6,17,19,28,32,
            39,40,41,42,43,44,45,
            50,58,62,70
        ];

        const darkBoxes = Array.from({ length: 72 }, (_, i) => i + 1)
            .filter(box => !litBoxes.includes(box));

        // Update lit boxes
        this.boxService.bulkUpdateBoxes(litBoxes, LotoBoxStatus.BUILDING).subscribe({
            next: () => console.log('Letter A lit boxes updated'),
            error: (err) => console.error('Failed to update lit boxes:', err)
        });

        // Update dark boxes
        this.boxService.bulkUpdateBoxes(darkBoxes, LotoBoxStatus.CLOSED).subscribe({
            next: () => console.log('Letter A dark boxes updated'),
            error: (err) => console.error('Failed to update dark boxes:', err)
        });
    }

    
        setBoxesForB(): void {
            /**
             * Letter B pattern on 6x12 grid (72 boxes)
             * Boxes 1-72 arranged as:
             * Row 1: 1-12
             * Row 2: 13-24
             * Row 3: 25-36
             * Row 4: 37-48
             * Row 5: 49-60
             * Row 6: 61-72
             * 
             * Pattern:
             * #####
             * #   #
             * ####
             * #   #
             * #   #
             * #####
             */
    
            const litBoxes = [
                // Top row
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                // Left column
                13, 25, 37, 49, 61,
                // Right column (top section)
                24, 36,
                // Middle horizontal bar
                37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                // Right column (bottom section)
                50, 60,
                // Bottom row
                61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72
            ];
    
            const darkBoxes = Array.from({ length: 72 }, (_, i) => i + 1)
                .filter(box => !litBoxes.includes(box));
    
            // Update lit boxes
            this.boxService.bulkUpdateBoxes(litBoxes, LotoBoxStatus.BUILDING).subscribe({
                next: () => console.log('Letter B lit boxes updated'),
                error: (err) => console.error('Failed to update lit boxes:', err)
            });
    
            // Update dark boxes
            this.boxService.bulkUpdateBoxes(darkBoxes, LotoBoxStatus.CLOSED).subscribe({
                next: () => console.log('Letter B dark boxes updated'),
                error: (err) => console.error('Failed to update dark boxes:', err)
            });
        }
}