import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-naming-convention',
  standalone: true,
  imports: [],
  templateUrl: './naming-convention.component.html',
  styleUrl: './naming-convention.component.css'
})
export class NamingConventionComponent {
  // Tab state
  activeTab = signal<'valve' | 'breaker'>('valve');

  // Interactive name builder state
  selectedEquipment = signal<string>('');
  selectedKeyword = signal<string>('');
  builtName = signal<string>('');

  // Valve naming examples with breakdown
  valveExamples = [
    { name: 'HP TERM ATEMP STR (BFW100) OUTLET ROOT', equipment: 'HP TERM ATEMP STR', tag: 'BFW100', type: 'ROOT' },
    { name: 'HP TERM ATEMP FW FIT-BFW704B LO SIDE ROOT ISO', equipment: 'HP TERM ATEMP FW', tag: 'FIT-BFW704B', type: 'ISO' },
    { name: 'ACHE 1 OUTLET PI-CCW219 ISO', equipment: 'ACHE 1 OUTLET', tag: 'PI-CCW219', type: 'ISO' },
    { name: 'AUX BOILER BFP A SUCTION ISO', equipment: 'AUX BOILER BFP A SUCTION', tag: '', type: 'ISO' },
    { name: 'BFP B HP DISCHARGE MOV EQ', equipment: 'BFP B HP DISCHARGE MOV', tag: '', type: 'EQ' },
    { name: 'MIXED BED EFFLUENT HEADER (C/D SIDE) ISO', equipment: 'MIXED BED EFFLUENT HEADER', tag: '', type: 'ISO' }
  ];

  // Valve keywords with descriptions
  valveKeywords = [
    { keyword: 'ISO', description: 'Isolation valve' },
    { keyword: 'DRAIN', description: 'Drain valve' },
    { keyword: 'VENT', description: 'Vent valve' },
    { keyword: 'EQ', description: 'Equalizing valve' },
    { keyword: 'ROOT', description: 'Root valve' },
    { keyword: 'BLOCK', description: 'Block valve' },
    { keyword: 'LO SIDE', description: 'Low pressure side' },
    { keyword: 'HI SIDE', description: 'High pressure side' },
    { keyword: 'UPSTREAM', description: 'Before equipment' },
    { keyword: 'DOWNSTREAM', description: 'After equipment' }
  ];

  // Breaker location examples
  breakerLocationExamples = [
    { location: 'MVB', bus: 'SWITCHGEAR 1', breaker: 'CUBICLE 9B' },
    { location: 'ACC MCC', bus: '02-ACC-MCC-241', breaker: 'BR12FM' },
    { location: 'SWITCH YARD BLDG', bus: '00-LVE-PPL-02 125VDC PANELBOARD', breaker: 'BR 21/23' }
  ];

  // Copy feedback
  copiedIndex = signal<number | null>(null);

  setActiveTab(tab: 'valve' | 'breaker') {
    this.activeTab.set(tab);
    this.resetBuilder();
  }

  selectKeyword(keyword: string) {
    this.selectedKeyword.set(keyword);
    this.updateBuiltName();
  }

  setEquipment(value: string) {
    this.selectedEquipment.set(value);
    this.updateBuiltName();
  }

  updateBuiltName() {
    const equipment = this.selectedEquipment();
    const keyword = this.selectedKeyword();
    if (equipment || keyword) {
      this.builtName.set(`${equipment} ${keyword}`.trim());
    } else {
      this.builtName.set('');
    }
  }

  resetBuilder() {
    this.selectedEquipment.set('');
    this.selectedKeyword.set('');
    this.builtName.set('');
  }

  copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedIndex.set(index);
      setTimeout(() => this.copiedIndex.set(null), 2000);
    });
  }

  copyBuiltName() {
    const name = this.builtName();
    if (name) {
      navigator.clipboard.writeText(name);
    }
  }
}
