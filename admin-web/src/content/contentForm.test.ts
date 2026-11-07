import { describe, expect, it } from 'vitest';

import { CONTENT_CONFIGS } from './configs';
import { toFormValues, toPayload, type Field } from './contentForm';

const fields: Field[] = [
  { name: 'titre', label: 'Titre', type: 'text', required: true },
  { name: 'icone', label: 'Icône', type: 'text' },
  { name: 'semaineMin', label: 'Semaine', type: 'number', nullable: true },
  { name: 'ordre', label: 'Ordre', type: 'number' },
  { name: 'langue', label: 'Langue', type: 'select', options: [], defaultValue: 'fr' },
  { name: 'publie', label: 'Publié', type: 'checkbox', defaultValue: false },
  { name: 'examens', label: 'Examens', type: 'list' },
  { name: 'rappel.mode', label: 'Rappel', type: 'select', options: [], defaultValue: 'aucun' },
  { name: 'rappel.dureeJours', label: 'Durée', type: 'number', nullable: true },
];

describe('toFormValues', () => {
  it('applique les valeurs par défaut pour une création', () => {
    expect(toFormValues(fields)).toEqual({
      titre: '',
      icone: '',
      semaineMin: '',
      ordre: '',
      langue: 'fr',
      publie: false,
      examens: '',
      'rappel.mode': 'aucun',
      'rappel.dureeJours': '',
    });
  });

  it('lit un document existant, sous-objets et listes compris', () => {
    const values = toFormValues(fields, {
      titre: 'Buvez',
      semaineMin: 12,
      publie: true,
      examens: ['Tension', 'Poids'],
      rappel: { mode: 'echeance', dureeJours: 1095 },
    });
    expect(values.titre).toBe('Buvez');
    expect(values.semaineMin).toBe('12');
    expect(values.publie).toBe(true);
    expect(values.examens).toBe('Tension\nPoids');
    expect(values['rappel.mode']).toBe('echeance');
    expect(values['rappel.dureeJours']).toBe('1095');
  });
});

describe('toPayload', () => {
  const values = {
    titre: '  Buvez  ',
    icone: '',
    semaineMin: '',
    ordre: '',
    langue: 'fr',
    publie: true,
    examens: 'Tension\n\n  Poids  \n',
    'rappel.mode': 'echeance',
    'rappel.dureeJours': '1095',
  };

  it('omet les champs vides à la création', () => {
    expect(toPayload(fields, values, 'create')).toEqual({
      titre: 'Buvez',
      langue: 'fr',
      publie: true,
      examens: ['Tension', 'Poids'],
      rappel: { mode: 'echeance', dureeJours: 1095 },
    });
  });

  it('efface (null) les champs facultatifs vidés en modification, sauf les nombres non nullables', () => {
    const payload = toPayload(fields, { ...values, 'rappel.dureeJours': '' }, 'update');
    expect(payload.icone).toBeNull();
    expect(payload.semaineMin).toBeNull();
    expect(payload).not.toHaveProperty('ordre');
    expect(payload.rappel).toEqual({ mode: 'echeance', dureeJours: null });
  });
});

describe('CONTENT_CONFIGS', () => {
  it('a des noms de champs uniques et des colonnes pour chaque contenu', () => {
    for (const config of Object.values(CONTENT_CONFIGS)) {
      const names = config.fields.map((f) => f.name);
      expect(new Set(names).size).toBe(names.length);
      expect(names).toContain(config.titleField);
      expect(config.columns.length).toBeGreaterThan(0);
    }
  });
});
