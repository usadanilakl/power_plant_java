// question-processor.service.ts
import { Injectable } from '@angular/core';
import { Question } from '../../models/ui/question.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionProcessorService {
  processQuestion(question: Question): { action: string; data: any } {
    console.log(`Processing question: ${question}`);
    switch (question.type) {
      case 'text':
        return this.handleTextQuestion(question);
      case 'file':
        return this.handleFileQuestion(question);
      case 'video':
        return this.handleVideoQuestion(question);
      default:
        console.warn(`Unsupported question type: ${question.type}`);
        return { action: 'unsupported', data: null };
    }
  }

  private handleTextQuestion(question: Question) {
    return { action: 'display', data: question.content };
  }

  private handleFileQuestion(question: Question) {
    return { action: 'open', data: question.content };
  }

  private handleVideoQuestion(question: Question) {
    return { action: 'play', data: question.content };
  }
}