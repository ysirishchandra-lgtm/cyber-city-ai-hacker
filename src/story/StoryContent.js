/**
 * SCAR — THE LAST CHOICE
 * StoryContent.js — All narrative content, missions, choices, dialogue
 * Author: Sirish (Lead/Integration)
 *
 * This is the single source of all story data.
 * Modify here to change narrative — no touching engine files.
 */

import { POWER_PATH, HERO_RELATIONSHIP, ENDING } from '../core/GameState.js';
import { OBJECTIVE_TYPE } from '../core/ChoiceSystem.js';

// ─── CINEMATIC PANELS ─────────────────────────────────────────────────────────
// Ashwidha's system renders these. Each panel = one screen of story.
export const INTRO_PANELS = [
  {
    id: 'intro_1',
    text: 'In a world where everyone was born with a power...',
    subtext: null,
    duration: 3500,
    style: 'fade',
  },
  {
    id: 'intro_2',
    text: '...you were the only one who wasn\'t.',
    subtext: null,
    duration: 3500,
    style: 'fade',
  },
  {
    id: 'intro_3',
    text: 'They could fly. Control minds. Bend matter.',
    subtext: 'You could only watch.',
    duration: 4000,
    style: 'fade',
  },
  {
    id: 'intro_4',
    text: 'Every day was a quiet humiliation.',
    subtext: 'Every day, you told yourself it didn\'t matter.',
    duration: 4000,
    style: 'fade',
  },
  {
    id: 'intro_5',
    text: 'Then one night, they came.',
    subtext: null,
    duration: 3000,
    style: 'flash',
  },
  {
    id: 'intro_6',
    text: 'You fought back.',
    subtext: 'It was the bravest thing you\'d ever done.',
    duration: 3000,
    style: 'fade',
  },
  {
    id: 'intro_7',
    text: 'It wasn\'t enough.',
    subtext: null,
    duration: 3000,
    style: 'fade',
  },
  {
    id: 'intro_8',
    text: 'They left you with something.',
    subtext: 'A scar.',
    duration: 4000,
    style: 'slow_reveal',
  },
  {
    id: 'intro_9',
    text: 'And a question.',
    subtext: null,
    duration: 3000,
    style: 'fade',
  },
  {
    id: 'intro_10',
    text: '"Did I survive... or did something in me die?"',
    subtext: null,
    duration: 5000,
    style: 'fade',
  },
  {
    id: 'intro_11',
    text: 'SCAR',
    subtext: 'THE LAST CHOICE',
    duration: 4000,
    style: 'title',
  },
];

// ─── ATTACK SEQUENCE PANELS ───────────────────────────────────────────────────
export const ATTACK_PANELS = [
  {
    id: 'attack_1',
    text: 'They appeared from the shadows.',
    subtext: 'Three of them. All powered.',
    duration: 2500,
  },
  {
    id: 'attack_2',
    text: 'You stood your ground.',
    subtext: null,
    duration: 2000,
  },
  {
    id: 'attack_3',
    text: '...',
    subtext: null,
    duration: 1500,
    style: 'beat',
  },
  {
    id: 'attack_4',
    text: 'It was over in seconds.',
    subtext: null,
    duration: 2500,
    style: 'impact',
  },
];

// ─── SCAR MOMENT ─────────────────────────────────────────────────────────────
export const SCAR_PANELS = [
  {
    id: 'scar_1',
    text: 'On the ground. Alone.',
    subtext: null,
    duration: 3000,
  },
  {
    id: 'scar_2',
    text: 'The pain wasn\'t the worst part.',
    subtext: 'The worst part was that no one came.',
    duration: 4000,
  },
  {
    id: 'scar_3',
    text: 'Something shifted inside you.',
    subtext: 'Not anger. Not fear.',
    duration: 3500,
  },
  {
    id: 'scar_4',
    text: 'Clarity.',
    subtext: null,
    duration: 2500,
    style: 'highlight',
  },
  {
    id: 'scar_5',
    text: '"I don\'t need to become like them."',
    subtext: '"I need to become something they can\'t ignore."',
    duration: 5000,
    style: 'quote',
  },
];

// ─── DIALOGUE ─────────────────────────────────────────────────────────────────
// Keyed by dialogueId — Ashwidha's system renders these as speech bubbles / cutscenes
export const DIALOGUES = {
  d_power_awakening_intro: {
    id: 'd_power_awakening_intro',
    lines: [
      { speaker: 'INNER VOICE', text: 'It\'s there. Something just below the surface.' },
      { speaker: 'INNER VOICE', text: 'The question is — what will you do with it?' },
    ],
  },
  d_hero_first_contact: {
    id: 'd_hero_first_contact',
    lines: [
      { speaker: 'ATLAS', text: 'I\'ve been watching you.' },
      { speaker: 'ATLAS', text: 'Someone like you — with that kind of power — needs guidance.' },
      { speaker: 'PLAYER', text: '(You say nothing. You don\'t trust him yet.)' },
    ],
  },
  d_hero_warning: {
    id: 'd_hero_warning',
    lines: [
      { speaker: 'ATLAS', text: 'You\'re becoming dangerous.' },
      { speaker: 'ATLAS', text: 'I can\'t allow that. Not in my city.' },
      { speaker: 'PLAYER', text: '"Your city? It belongs to everyone."' },
      { speaker: 'ATLAS', text: 'That\'s exactly what someone dangerous would say.' },
    ],
  },
  d_final_confrontation: {
    id: 'd_final_confrontation',
    lines: [
      { speaker: 'ATLAS', text: 'This ends here.' },
      { speaker: 'ATLAS', text: 'Someone has to control what happens in this world.' },
      { speaker: 'PLAYER', text: '"Control. That\'s what this was always about."' },
      { speaker: 'ATLAS', text: 'Without order, everything burns.' },
      { speaker: 'PLAYER', text: '"And without freedom — what are we protecting?"' },
    ],
  },
  d_choice_aftermath_aggressive: {
    id: 'd_choice_aftermath_aggressive',
    lines: [
      { speaker: 'INNER VOICE', text: 'That felt... right. Is that who you are now?' },
    ],
  },
  d_choice_aftermath_protective: {
    id: 'd_choice_aftermath_protective',
    lines: [
      { speaker: 'INNER VOICE', text: 'You could have taken more. You chose not to.' },
    ],
  },
  d_choice_aftermath_strategic: {
    id: 'd_choice_aftermath_strategic',
    lines: [
      { speaker: 'INNER VOICE', text: 'Smart. But was it honest?' },
    ],
  },
};

// ─── CHOICES ──────────────────────────────────────────────────────────────────
// pathInfluence: 'AGGRESSIVE' | 'PROTECTIVE' | 'STRATEGIC' | 'NEUTRAL'
export const CHOICES = [
  {
    id: 'CHOICE_CONFRONTATION_L1',
    prompt: 'A powered gang corners an unarmed civilian. What do you do?',
    context: 'You have no power yet. But you have a choice.',
    level: 1,
    options: [
      {
        id: 'opt_intervene_direct',
        text: 'Step in. Physically block them.',
        pathInfluence: 'PROTECTIVE',
        consequences: {
          healthChange: -15,
          followUpDialogue: 'd_choice_aftermath_protective',
        },
      },
      {
        id: 'opt_distract',
        text: 'Create a distraction. Buy time for the civilian to run.',
        pathInfluence: 'STRATEGIC',
        consequences: {
          healthChange: 0,
          followUpDialogue: 'd_choice_aftermath_strategic',
        },
      },
      {
        id: 'opt_retreat',
        text: 'Walk away. You\'re powerless. There\'s nothing you can do.',
        pathInfluence: 'NEUTRAL',
        consequences: {
          healthChange: 0,
        },
      },
    ],
  },
  {
    id: 'CHOICE_POWER_AWAKENING',
    prompt: 'The power is surfacing. You feel three paths pulling at you.',
    context: 'This will define how your power manifests. Choose carefully.',
    level: 1,
    isPowerChoice: true,
    options: [
      {
        id: 'opt_destruction',
        text: 'DESTRUCTION — Make sure they can never hurt anyone again.',
        subtext: 'Aggressive path. Raw power. High damage. Low trust.',
        pathInfluence: 'AGGRESSIVE',
        consequences: {
          setPowerPath: POWER_PATH.AGGRESSIVE,
          followUpDialogue: 'd_choice_aftermath_aggressive',
        },
      },
      {
        id: 'opt_protection',
        text: 'PROTECTION — Make sure no one gets hurt.',
        subtext: 'Protective path. Shielding. Defense. High trust.',
        pathInfluence: 'PROTECTIVE',
        consequences: {
          setPowerPath: POWER_PATH.PROTECTIVE,
          followUpDialogue: 'd_choice_aftermath_protective',
        },
      },
      {
        id: 'opt_control',
        text: 'CONTROL — Make sure you\'re never powerless again.',
        subtext: 'Strategic path. Manipulation. Influence. Unpredictable.',
        pathInfluence: 'STRATEGIC',
        consequences: {
          setPowerPath: POWER_PATH.STRATEGIC,
          followUpDialogue: 'd_choice_aftermath_strategic',
        },
      },
    ],
  },
  {
    id: 'CHOICE_HERO_OFFER',
    prompt: 'Atlas offers to train you — under his rules.',
    context: 'He\'s powerful. He might be right. Or he might be using you.',
    level: 2,
    options: [
      {
        id: 'opt_accept_terms',
        text: 'Accept his terms. Train under him.',
        pathInfluence: 'PROTECTIVE',
        consequences: {
          heroRelationship: HERO_RELATIONSHIP.SUSPICIOUS,
          followUpDialogue: 'd_choice_aftermath_protective',
        },
      },
      {
        id: 'opt_decline',
        text: 'Decline. You\'ve come this far alone.',
        pathInfluence: 'AGGRESSIVE',
        consequences: {
          heroRelationship: HERO_RELATIONSHIP.HOSTILE,
          followUpDialogue: 'd_choice_aftermath_aggressive',
        },
      },
      {
        id: 'opt_negotiate',
        text: 'Counter-offer. Your terms, not his.',
        pathInfluence: 'STRATEGIC',
        consequences: {
          heroRelationship: HERO_RELATIONSHIP.SUSPICIOUS,
          followUpDialogue: 'd_choice_aftermath_strategic',
        },
      },
    ],
  },
  {
    id: 'CHOICE_CIVILIAN_CROSSFIRE',
    prompt: 'Civilians are in the crossfire between you and Atlas\'s forces.',
    context: 'Protecting them will cost you. Ignoring them is faster.',
    level: 3,
    options: [
      {
        id: 'opt_shield_them',
        text: 'Shield every civilian. Take the damage yourself.',
        pathInfluence: 'PROTECTIVE',
        consequences: {
          healthChange: -20,
          followUpDialogue: 'd_choice_aftermath_protective',
        },
      },
      {
        id: 'opt_push_through',
        text: 'Push through. Collateral damage is unavoidable.',
        pathInfluence: 'AGGRESSIVE',
        consequences: {
          healthChange: 0,
          heroRelationship: HERO_RELATIONSHIP.HUNTING,
        },
      },
      {
        id: 'opt_redirect',
        text: 'Redirect the fight away from civilians. Slower but cleaner.',
        pathInfluence: 'STRATEGIC',
        consequences: {
          healthChange: -10,
          followUpDialogue: 'd_choice_aftermath_strategic',
        },
      },
    ],
  },
];

// ─── MISSIONS ─────────────────────────────────────────────────────────────────
export const MISSIONS = [
  // ── LEVEL 1: THE WEAK ────────────────────────────────────────────────────
  {
    id: 'M1_SURVIVE_THE_NIGHT',
    level: 1,
    title: 'Survive the Night',
    description: 'You\'re injured and alone. Reach the safe house before dawn.',
    objectives: [
      {
        id: 'obj_reach_safehouse',
        description: 'Reach the safe house',
        type: OBJECTIVE_TYPE.REACH_AREA,
        target: { areaId: 'SAFEHOUSE_L1' },
        required: true,
        progress: 0,
        completed: false,
      },
      {
        id: 'obj_avoid_patrol',
        description: 'Avoid patrol detection (optional)',
        type: OBJECTIVE_TYPE.SURVIVE_TIME,
        target: { seconds: 60 },
        required: false,
        progress: 0,
        completed: false,
      },
    ],
    completionCondition: 'Player reaches SAFEHOUSE_L1 area trigger',
    failureCondition: 'Player health reaches 0',
    nextMission: 'M1_FIND_ANSWERS',
  },
  {
    id: 'M1_FIND_ANSWERS',
    level: 1,
    title: 'Find Answers',
    description: 'Someone knows why you were attacked. Find them.',
    objectives: [
      {
        id: 'obj_talk_informant',
        description: 'Talk to the informant',
        type: OBJECTIVE_TYPE.TALK,
        target: { npcId: 'INFORMANT_KIRA' },
        required: true,
        progress: 0,
        completed: false,
      },
    ],
    completionCondition: 'Player interacts with INFORMANT_KIRA',
    failureCondition: 'Player health reaches 0',
    nextMission: 'M1_POWER_AWAKENING',
  },
  {
    id: 'M1_POWER_AWAKENING',
    level: 1,
    title: 'The First Scar Speaks',
    description: 'Your scar is reacting to something. Find out what.',
    objectives: [
      {
        id: 'obj_reach_old_district',
        description: 'Reach the old district',
        type: OBJECTIVE_TYPE.REACH_AREA,
        target: { areaId: 'OLD_DISTRICT' },
        required: true,
        progress: 0,
        completed: false,
      },
      {
        id: 'obj_defeat_enemies',
        description: 'Survive the encounter (defeat 3 enemies)',
        type: OBJECTIVE_TYPE.DEFEAT_ENEMIES,
        target: { count: 3 },
        required: true,
        progress: 0,
        completed: false,
      },
    ],
    completionCondition: 'Player defeats 3 enemies in OLD_DISTRICT — triggers CHOICE_POWER_AWAKENING',
    failureCondition: 'Player health reaches 0',
    nextMission: null, // Level transition
  },

  // ── LEVEL 2: THE RISING ──────────────────────────────────────────────────
  {
    id: 'M2_FIRST_POWER_TEST',
    level: 2,
    title: 'Learn What You Are',
    description: 'Your power is new and unstable. Test it before they find you.',
    objectives: [
      {
        id: 'obj_use_power_3',
        description: 'Use your power 3 times',
        type: OBJECTIVE_TYPE.DEFEAT_ENEMIES,
        target: { count: 3 },
        required: true,
        progress: 0,
        completed: false,
      },
      {
        id: 'obj_escape_patrol',
        description: 'Escape Atlas\'s patrol',
        type: OBJECTIVE_TYPE.ESCAPE,
        target: { areaId: 'PATROL_ZONE' },
        required: true,
        progress: 0,
        completed: false,
      },
    ],
    completionCondition: 'Player escapes patrol after using power',
    failureCondition: 'Player captured (health 0) or time expires',
    nextMission: 'M2_HERO_CONTACT',
  },
  {
    id: 'M2_HERO_CONTACT',
    level: 2,
    title: 'Atlas Knows Your Name',
    description: 'Atlas has found you. What happens next depends on what you choose.',
    objectives: [
      {
        id: 'obj_meet_atlas',
        description: 'Meet Atlas at the rooftop',
        type: OBJECTIVE_TYPE.REACH_AREA,
        target: { areaId: 'ROOFTOP_MEETING' },
        required: true,
        progress: 0,
        completed: false,
      },
    ],
    completionCondition: 'Player reaches ROOFTOP_MEETING — triggers CHOICE_HERO_OFFER',
    failureCondition: 'Player health reaches 0',
    nextMission: null, // Level transition
  },

  // ── LEVEL 3: THE THREAT ──────────────────────────────────────────────────
  {
    id: 'M3_HUNTED',
    level: 3,
    title: 'The City Turns',
    description: 'Atlas has declared you a threat. Survive his forces. Protect who you can.',
    objectives: [
      {
        id: 'obj_protect_civilians',
        description: 'Protect 3 civilians from Atlas\'s forces',
        type: OBJECTIVE_TYPE.PROTECT,
        target: { count: 3 },
        required: false,
        progress: 0,
        completed: false,
      },
      {
        id: 'obj_reach_final_district',
        description: 'Reach Atlas\'s district',
        type: OBJECTIVE_TYPE.REACH_AREA,
        target: { areaId: 'ATLAS_DISTRICT' },
        required: true,
        progress: 0,
        completed: false,
      },
    ],
    completionCondition: 'Player reaches ATLAS_DISTRICT',
    failureCondition: 'Player health reaches 0',
    nextMission: 'M3_FINAL_BATTLE',
  },
  {
    id: 'M3_FINAL_BATTLE',
    level: 3,
    title: 'The Last Choice',
    description: 'Face Atlas. End this. Your way.',
    objectives: [
      {
        id: 'obj_confront_atlas',
        description: 'Confront Atlas',
        type: OBJECTIVE_TYPE.TALK,
        target: { npcId: 'ATLAS_FINAL' },
        required: true,
        progress: 0,
        completed: false,
      },
      {
        id: 'obj_final_battle',
        description: 'Defeat or subdue Atlas',
        type: OBJECTIVE_TYPE.DEFEAT_ENEMIES,
        target: { count: 1, targetId: 'ATLAS_BOSS' },
        required: true,
        progress: 0,
        completed: false,
      },
    ],
    completionCondition: 'Atlas defeated — triggers FINAL_CHOICE phase',
    failureCondition: 'Player health reaches 0',
    nextMission: null,
  },
];

// ─── ENDINGS ──────────────────────────────────────────────────────────────────
export const ENDING_CONTENT = {
  [ENDING.VILLAIN]: {
    title: 'The Villain',
    headline: 'You became what hurt you.',
    text: `The city feared Atlas. Now it fears you.
You told yourself it was necessary. That power without consequence
was the only way to stop people like Atlas.
But you became exactly what you swore to oppose.
The scar didn't change you. You let it define you.`,
    tone: 'dark',
  },
  [ENDING.HERO]: {
    title: 'The Hero',
    headline: 'You became what the city needed.',
    text: `You could have taken everything. You chose protection instead.
Atlas is gone. The city is safer — not because of fear,
but because someone chose to put others first.
The scar is still there. But now it means something different.
It means you survived. And kept your humanity doing it.`,
    tone: 'light',
  },
  [ENDING.SAVIOR]: {
    title: 'The Savior',
    headline: 'You found the third path.',
    text: `Neither villain nor hero.
You dismantled Atlas's control structure from the inside,
protected the people who couldn't protect themselves,
and then stepped back.
You didn't want power. You wanted fairness.
And for one moment — you made it real.`,
    tone: 'hopeful',
  },
  [ENDING.HUMAN]: {
    title: 'The Human',
    headline: 'You remembered what mattered.',
    text: `At the final moment, you put down your power.
Not because you were weak. Because you understood something
Atlas never did: the moment you decide you know what\'s best
for everyone — you\'ve already lost.
You walked away. Powerless again. By choice.
Some called it surrender. You called it wisdom.`,
    tone: 'profound',
    secret: true,
  },
};
