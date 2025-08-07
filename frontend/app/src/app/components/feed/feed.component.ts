import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { PostCardComponent } from '../post-card/post-card.component';


@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, MatCardModule, PostCardComponent],
  template: `
    <div class="feed">
      @for (post of posts; track post.content) {
        <app-post-card [post]="post"></app-post-card>
      }
    </div>
  `,
  styles: [`
    .feed {
      display: flex;
      padding:20px;
      flex-direction: column;
      gap: 16px;
      width: calc(100% - 40px) ;
      margin: 0 auto;
    }
  `]
})
export class FeedComponent {
  posts = [
    { user: 'User1', time: '2h ago', content: 'WelcomeLddddddddddddd Lorem ipsum dolor, sit amet consectetur adipisicing elit. Praesentium deserunt ea quis nam modi odit veritatis, sequi maxime corrupti hic fugiat nisi quas fuga aliquam, rem iusto reprehenderit itaque amet!Lorem orem ipsum dolor sit amet consectetur, adipisicing elit. Veniam dolorem provident tempora vitae aliquam vero doloribus magni, incidunt dolore officia distinctio enim quaerat expedita quas ipsum adipisci modi reiciendis est. Just posted my first update!Lddddddddddddd Lorem ip ium deserunt ea quis nam modi odit veritatis, sequi maxime corrupti hic fugiat nisi quas fuga aliquam, rem iusto reprehenderit itaque amet!Lorem orem ipsum dolor sit amet consectetur, adipisicing elit. Veniam dolorem p date! to my social media app!' },
    { user: 'User2', time: '1h ago', content: 'This app is awesome!' },
    { user: 'User3', time: '30m ago', content: 'Just posted my first update!' },


  ];
}