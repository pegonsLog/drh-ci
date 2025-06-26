import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'abbreviateYear',
  standalone: true,
})
export class AbbreviateYearPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) {
      return 'Disponível';
    }
    // Substitui anos de 4 dígitos por 2 dígitos (ex: "2022/2023" -> "22/23")
    return value.replace(/\b\d{2}(\d{2})\b/g, '$1');
  }
}
