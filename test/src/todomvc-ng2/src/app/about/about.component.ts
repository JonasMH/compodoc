import { Component, HostListener } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

/**
 * The about component
 *
 * Display some text with links for details about TodoMVC & Compodoc.
 */
@Component({
    selector: 'about',
    templateUrl: './about.component.html'
})
export class AboutComponent {

     public subscriptions: Subscription[];

    /**
     * HostListener mouseup description
     */
     @HostListener('mouseup', ['$event.clientX', '$event.clientY'])
     onMouseup(mouseX: number, mouseY: number): void {

     }
}
