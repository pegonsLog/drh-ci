import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replace',
  standalone: true
})
export class ReplacePipe implements PipeTransform {
  transform(value: string, searchValue: string, replaceValue: string): string {
    if (!value) {
      return '';
    }
    // Usa uma RegExp global para substituir todas as ocorrências
    const regex = new RegExp(searchValue, 'g');
    return value.replace(regex, replaceValue);
  }
}
