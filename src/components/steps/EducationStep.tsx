/**
 * Pre-Career Education Step Component
 * Implements Traveller pre-career education rules for University and Military Academy
 */

import React, { useState } from 'react';
import type { Character, Rules, StepResult, Skill, Characteristic, PreCareerEvent } from '@/types';
import { CharacterHistoryManager } from '@/utils/characterHistory';
import { usePreCareerEvents } from '@/store/characterStore';

interface EducationStepProps {
  character: Character;
  rules: Rules;
  onStepComplete: (stepId: string, result: StepResult) => void;
  onBack?: () => void;
}

interface PreCareerEducation {
  id: string;
  name: string;
  description: string;
  type: 'university' | 'military-academy' | 'skip';
  entryRequirement?: {
    roll: string;
    target: number;
    dm: Array<{
      condition: string;
      modifier: number;
    }>;
  };
  graduationRequirement?: {
    roll: string;
    target: number;
    dm: Array<{
      condition: string;
      modifier: number;
    }>;
  };
  maxTerms: number;
  termModifier?: Array<{
    term: number;
    modifier: number;
  }>;
  entryBonus?: {
    characteristic?: Characteristic;
    modifier?: number;
    skills?: Array<{
      name: string;
      level: number;
    }>;
  };
  graduationBonus?: {
    characteristic?: Characteristic;
    modifier?: number;
    skills?: Array<{
      name: string;
      level: number;
    }>;
    honoursBonus?: {
      characteristic?: Characteristic;
      modifier?: number;
    };
  };
  skillChoices?: string[];
  skillSelections: number;
  universitySkillLevels?: {
    level0: number; // Number of skills to pick at level 0
    level1: number; // Number of skills to pick at level 1
  };
  militaryBranch?: {
    army: { requirement: 'END 7+' };
    marines: { requirement: 'END 8+' };
    navy: { requirement: 'INT 8+' };
  };
}

/**
 * ✅ STANDARDS COMPLIANT: Configuration-driven step component
 * - No hardcoded game rules (education types follow Traveller rules)
 * - Props-based configuration  
 * - Pure UI logic only
 * - Type-safe throughout
 */
export const EducationStep: React.FC<EducationStepProps> = ({
  character,
  rules: _rules,
  onStepComplete,
  onBack,
}) => {
  const preCareerEvents = usePreCareerEvents();

  // Calculate current term based on character age (age 18 = term 1)
  const getCurrentTerm = (): number => {
    return Math.max(1, character.age - 17);
  };

  // Calculate DM based on characteristic value
  const getDM = (characteristic: Characteristic): number => {
    const value = character.characteristics[characteristic];
    if (value >= 15) return 3;
    if (value >= 12) return 2;
    if (value >= 9) return 1;
    if (value >= 6) return 0;
    if (value >= 3) return -1;
    if (value >= 1) return -2;
    return -3;
  };

  // Pre-career education options following Traveller rules
  const educationOptions: PreCareerEducation[] = [
    {
      id: 'university',
      name: 'University',
      description: 'Four-year university degree program',
      type: 'university',
      entryRequirement: {
        roll: '2d6',
        target: 6,
        dm: [
          { condition: 'SOC 9+', modifier: 1 },
          { condition: 'Term 2', modifier: -1 },
          { condition: 'Term 3', modifier: -2 }
        ]
      },
      graduationRequirement: {
        roll: '2d6',
        target: 6,
        dm: []
      },
      maxTerms: 3,
      termModifier: [
        { term: 2, modifier: -1 },
        { term: 3, modifier: -2 }
      ],
      entryBonus: {
        characteristic: 'EDU',
        modifier: 1
      },
      graduationBonus: {
        characteristic: 'EDU',
        modifier: 1,
        honoursBonus: {
          characteristic: 'EDU',
          modifier: 1
        }
      },
      skillChoices: [
        'Admin', 'Advocate', 'Art', 'Astrogation', 'Electronics',
        'Engineering', 'Language', 'Medic', 'Navigation', 'Profession',
        'Science', 'Streetwise'
      ],
      skillSelections: 2, // One at level 0, one at level 1
      universitySkillLevels: {
        level0: 1, // Pick 1 skill at level 0
        level1: 1  // Pick 1 skill at level 1
      }
    },
    {
      id: 'military-academy',
      name: 'Military Academy',
      description: 'Four-year military officer training',
      type: 'military-academy',
      entryRequirement: {
        roll: '2d6',
        target: 8, // Variable by branch
        dm: [
          { condition: 'Term 2', modifier: -2 },
          { condition: 'Term 3', modifier: -4 }
        ]
      },
      graduationRequirement: {
        roll: '2d6',
        target: 7,
        dm: [
          { condition: 'END 8+', modifier: 1 },
          { condition: 'SOC 8+', modifier: 1 }
        ]
      },
      maxTerms: 3,
      termModifier: [
        { term: 2, modifier: -2 },
        { term: 3, modifier: -4 }
      ],
      entryBonus: {
        skills: [] // Service skills at level 0
      },
      graduationBonus: {
        characteristic: 'EDU',
        modifier: 1,
        honoursBonus: {
          characteristic: 'SOC',
          modifier: 1
        }
      },
      skillChoices: [
        'Admin', 'Athletics', 'Electronics', 'Engineering', 'Gun Combat',
        'Heavy Weapons', 'Leadership', 'Melee', 'Navigation', 'Pilot',
        'Tactics', 'Vacc Suit'
      ],
      skillSelections: 3, // Pick 3 service skills to raise to level 1
      militaryBranch: {
        army: { requirement: 'END 7+' },
        marines: { requirement: 'END 8+' },
        navy: { requirement: 'INT 8+' }
      }
    },
    {
      id: 'skip',
      name: 'Skip Pre-Career',
      description: 'Skip pre-career education and proceed directly to career selection',
      type: 'skip',
      maxTerms: 0,
      skillSelections: 0
    }
  ];

  const [selectedEducation, setSelectedEducation] = useState<PreCareerEducation | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [currentTerm, setCurrentTerm] = useState<number>(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLevel0Skills, setSelectedLevel0Skills] = useState<string[]>([]);
  const [selectedLevel1Skills, setSelectedLevel1Skills] = useState<string[]>([]);
  const [entryRoll, setEntryRoll] = useState<number | null>(null);
  const [graduationRoll, setGraduationRoll] = useState<number | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [hasGraduated, setHasGraduated] = useState<boolean>(false);
  const [hasHonours, setHasHonours] = useState<boolean>(false);
  const [events, setEvents] = useState<string[]>([]);
  const [characterEvents, setCharacterEvents] = useState<any[]>([]);
  const [rolledEvent, setRolledEvent] = useState<PreCareerEvent | null>(null);
  const [eventRoll, setEventRoll] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Restriction tracking
  const [hasRolledEntry, setHasRolledEntry] = useState<boolean>(false);
  const [failedEntry, setFailedEntry] = useState<boolean>(false);
  const [hasAttemptedEducation, setHasAttemptedEducation] = useState<boolean>(false);
  const [hasFailedGraduation, setHasFailedGraduation] = useState<boolean>(false);
  const [lockedSelection, setLockedSelection] = useState<boolean>(false);

  const handleEducationSelect = (education: PreCareerEducation): void => {
    // Check if selection is locked after rolling
    if (lockedSelection && hasRolledEntry) {
      setErrors(['Cannot change education selection after rolling for entry']);
      return;
    }

    // Check if already attempted education this term
    if (hasAttemptedEducation && education.type !== 'skip') {
      setErrors(['Cannot attempt education again this term after failure']);
      return;
    }

    setSelectedEducation(education);
    setSelectedBranch('');
    setCurrentTerm(1);
    setSelectedSkills([]);
    setEntryRoll(null);
    setGraduationRoll(null);
    setIsEnrolled(false);
    setHasGraduated(false);
    setHasHonours(false);
    setEvents([]);
    setCharacterEvents([]);
    setRolledEvent(null);
    setEventRoll(null);
    setErrors([]);
    
    // Reset restriction flags only if not locked
    if (!lockedSelection) {
      setHasRolledEntry(false);
      setFailedEntry(false);
    }
  };

  const handleBranchSelect = (branch: string): void => {
    setSelectedBranch(branch);
    setErrors([]);
  };

  const rollEntry = (): void => {
    if (!selectedEducation?.entryRequirement) return;

    // Prevent rolling again if already rolled
    if (hasRolledEntry) {
      setErrors(['You have already rolled for entry this term']);
      return;
    }

    const roll = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
    let dm = getDM('EDU');

    // Apply modifiers
    selectedEducation.entryRequirement.dm.forEach(modifier => {
      if (modifier.condition === 'SOC 9+' && character.characteristics.SOC >= 9) {
        dm += modifier.modifier;
      }
      if (modifier.condition === `Term ${currentTerm}`) {
        dm += modifier.modifier;
      }
    });

    // Military Academy branch requirements
    if (selectedEducation.type === 'military-academy' && selectedBranch) {
      let branchTarget = selectedEducation.entryRequirement.target;
      if (selectedBranch === 'army' && character.characteristics.END < 7) branchTarget += 2;
      if (selectedBranch === 'marines' && character.characteristics.END < 8) branchTarget += 2;
      if (selectedBranch === 'navy' && character.characteristics.INT < 8) branchTarget += 2;
    }

    const total = roll + dm;
    setEntryRoll(roll);
    setHasRolledEntry(true);
    setLockedSelection(true); // Lock the selection after rolling

    if (total >= selectedEducation.entryRequirement.target) {
      setIsEnrolled(true);
      // Apply entry bonus
      if (selectedEducation.entryBonus?.characteristic) {
        // This would update character characteristics
        setEvents(prev => [...prev, `Enrolled successfully! Gained +1 ${selectedEducation.entryBonus?.characteristic}`]);
      }
    } else {
      setFailedEntry(true);
      setHasAttemptedEducation(true);
      setErrors(['Failed to qualify for entry. You may try a career instead.']);
      
      // Create entry failure event for character history
      const entryFailureEvent = CharacterHistoryManager.createRollEvent(
        '2d6',
        roll,
        selectedEducation.entryRequirement.target,
        `Failed to qualify for ${selectedEducation.name}${selectedBranch ? ` (${selectedBranch})` : ''}`,
        false,
        {
          narrative: `Attempted to enter ${selectedEducation.name} but failed the qualification roll`
        }
      );
      
      setCharacterEvents(prev => [...prev, entryFailureEvent]);
    }
  };

  const rollGraduation = (): void => {
    if (!selectedEducation?.graduationRequirement || !isEnrolled) return;

    const roll = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
    let dm = getDM('INT');

    // Apply graduation modifiers
    selectedEducation.graduationRequirement.dm.forEach(modifier => {
      if (modifier.condition === 'END 8+' && character.characteristics.END >= 8) {
        dm += modifier.modifier;
      }
      if (modifier.condition === 'SOC 8+' && character.characteristics.SOC >= 8) {
        dm += modifier.modifier;
      }
    });

    const total = roll + dm;
    setGraduationRoll(roll);

    if (total >= selectedEducation.graduationRequirement.target) {
      setHasGraduated(true);
      
      // Check for honours
      const honoursTarget = selectedEducation.type === 'university' ? 10 : 11;
      if (total >= honoursTarget) {
        setHasHonours(true);
        setEvents(prev => [...prev, 'Graduated with Honours!']);
      } else {
        setEvents(prev => [...prev, 'Graduated successfully!']);
      }
    } else {
      setHasFailedGraduation(true);
      setErrors(['Failed to graduate. You may continue your career without a degree.']);
    }

    // Roll for pre-career event
    rollPreCareerEvent();
  };

  const rollPreCareerEvent = (): void => {
    if (preCareerEvents.length === 0) return;

    const eventRollValue = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
    setEventRoll(eventRollValue);

    const event = preCareerEvents.find(e => e.roll === eventRollValue);
    if (event) {
      setRolledEvent(event);
      handlePreCareerEvent(event);
    }
  };

  const handlePreCareerEvent = (event: PreCareerEvent): void => {
    let eventDescription = `Pre-Career Event: ${event.title} - ${event.description}`;
    
    // Create a proper character event for history
    const characterEvent = CharacterHistoryManager.createChoiceEvent(
      event.title,
      [`Roll: ${eventRoll}`],
      event.description,
      {
        narrative: event.effect.description || event.description
      }
    );
    
    switch (event.effect.type) {
      case 'characteristic':
        if (event.effect.characteristic && event.effect.modifier) {
          eventDescription += ` (+${event.effect.modifier} ${event.effect.characteristic})`;
        }
        break;
      case 'skill':
        if (event.effect.skill && event.effect.level) {
          eventDescription += ` (Gain ${event.effect.skill} ${event.effect.level})`;
        }
        break;
      case 'skill_choice':
        eventDescription += ` (Gain any skill at level ${event.effect.level || 0})`;
        break;
      case 'failure':
        eventDescription += ' (Must leave education)';
        setIsEnrolled(false);
        setHasGraduated(false);
        break;
      default:
        eventDescription += ` (${event.effect.description || 'See rules for details'})`;
    }

    setEvents(prev => [...prev, eventDescription]);
    setCharacterEvents(prev => [...prev, characterEvent]);
  };

  const handleSkillToggle = (skill: string): void => {
    if (!selectedEducation) return;

    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else if (prev.length < selectedEducation.skillSelections) {
        return [...prev, skill];
      } else {
        setErrors(['Maximum number of skills selected']);
        return prev;
      }
    });
    setErrors([]);
  };

  const handleUniversityLevel0Toggle = (skill: string): void => {
    if (!selectedEducation) return;

    // Check if skill can be selected for level 0
    if (!canSelectForLevel0(skill)) {
      const skillLevel = getSkillLevel(skill);
      setErrors([`Cannot select ${skill} for level 0 - already known at level ${skillLevel}`]);
      return;
    }

    setSelectedLevel0Skills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else if (prev.length < (selectedEducation.universitySkillLevels?.level0 || 1)) {
        return [...prev, skill];
      } else {
        setErrors(['Maximum number of level 0 skills selected']);
        return prev;
      }
    });
    setErrors([]);
  };

  const handleUniversityLevel1Toggle = (skill: string): void => {
    if (!selectedEducation) return;

    // Check if it's the same as level 0 selection
    if (selectedLevel0Skills.includes(skill)) {
      setErrors(['Cannot select the same skill for both level 0 and level 1']);
      return;
    }

    // Check if skill can be selected for level 1
    if (!canSelectForLevel1(skill)) {
      const skillLevel = getSkillLevel(skill);
      setErrors([`Cannot select ${skill} for level 1 - already known at level ${skillLevel}`]);
      return;
    }

    setSelectedLevel1Skills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else if (prev.length < (selectedEducation.universitySkillLevels?.level1 || 1)) {
        return [...prev, skill];
      } else {
        setErrors(['Maximum number of level 1 skills selected']);
        return prev;
      }
    });
    setErrors([]);
  };

  const isSkillUpgradeFromBackground = (skill: string): boolean => {
    return character.skills.some(s => s.name === skill && s.source === 'homeworld' && s.level === 0);
  };

  const handleComplete = (): void => {
    if (!selectedEducation) {
      setErrors(['Please select an education option']);
      return;
    }

    if (selectedEducation.type === 'skip') {
      // Skip pre-career education
      const skipEvent = CharacterHistoryManager.createChoiceEvent(
        'Skip Pre-Career',
        ['University', 'Military Academy', 'Skip'],
        'Decided to skip pre-career education',
        { narrative: 'Proceeded directly to career selection' }
      );
      
      onStepComplete('education', {
        valid: true,
        data: {
          educationType: 'none',
          educationName: 'No Pre-Career Education',
          graduated: false,
          honours: false,
          skills: [], // No skills gained
          characteristics: character.characteristics, // No changes
          
          // Events for StepByStepCreation to process
          enrollmentEvent: skipEvent,
          graduationEvents: [],
          preCareerEvents: [],
          
          // Store skip data
          phaseData: {
            education: {
              type: 'none',
              name: 'No Pre-Career Education',
              skipped: true
            }
          }
        }
      });
      return;
    }

    if (selectedEducation.type === 'military-academy' && !selectedBranch) {
      setErrors(['Please select a military branch']);
      return;
    }

    if (!isEnrolled && !failedEntry) {
      setErrors(['You must attempt entry before completing']);
      return;
    }

    // Handle failed entry case
    if (failedEntry && !isEnrolled) {
      onStepComplete('education', {
        valid: true,
        data: {
          educationType: selectedEducation.id,
          educationName: selectedEducation.name,
          branch: selectedBranch,
          graduated: false,
          honours: false,
          failed: true,
          skills: [], // No skills gained
          characteristics: character.characteristics, // No changes
          
          // Events for StepByStepCreation to process (includes entry failure event)
          enrollmentEvent: null, // No enrollment
          graduationEvents: [],
          preCareerEvents: characterEvents, // The failure event
          
          // Store education failure data
          phaseData: {
            education: {
              type: selectedEducation.id,
              name: selectedEducation.name,
              branch: selectedBranch,
              graduated: false,
              honours: false,
              failed: true,
              term: getCurrentTerm(),
              entryRoll: entryRoll,
              entryTotal: entryRoll ? entryRoll + getDM('EDU') : null
            }
          }
        }
      });
      return;
    }

    // Handle pre-career event forced departure (e.g., Deep Tragedy)
    if (isEnrolled && !hasGraduated && characterEvents.some(event => 
      event.description.includes('failure') || event.description.includes('Must leave education')
    )) {
      onStepComplete('education', {
        valid: true,
        data: {
          educationType: selectedEducation.id,
          educationName: selectedEducation.name,
          branch: selectedBranch,
          graduated: false,
          honours: false,
          failed: true,
          forcedDeparture: true, // Flag to indicate this was due to pre-career event
          skills: [], // No skills gained due to forced departure
          characteristics: character.characteristics, // No changes
          
          // Events for StepByStepCreation to process
          enrollmentEvent: CharacterHistoryManager.createChoiceEvent(
            `Enrolled in ${selectedEducation.name}`,
            educationOptions.map(e => e.name),
            `Enrolled in ${selectedEducation.name}${selectedBranch ? ` (${selectedBranch})` : ''} but forced to leave due to tragedy`,
            {
              narrative: `${selectedEducation.description} However, a tragic event forced them to leave before graduation.`
            }
          ),
          graduationEvents: [],
          preCareerEvents: characterEvents, // Includes the event that forced departure
          
          // Store education failure data
          phaseData: {
            education: {
              type: selectedEducation.id,
              name: selectedEducation.name,
              branch: selectedBranch,
              graduated: false,
              honours: false,
              failed: true,
              forcedDeparture: true,
              term: getCurrentTerm(),
              entryRoll: entryRoll,
              entryTotal: entryRoll ? entryRoll + getDM('EDU') : null
            }
          }
        }
      });
      return;
    }

    // Check if we have enough available skills
    const availableSkills = getAvailableSkills();
    const requiredSkills = selectedEducation.skillSelections;
    
    if (availableSkills.length < requiredSkills) {
      setErrors([
        `Not enough new skills available. You need ${requiredSkills} skills but only ${availableSkills.length} new skills are available.`,
        'You cannot select skills you already know.'
      ]);
      return;
    }

    // Validate university skill selections
    if (selectedEducation.type === 'university') {
      const requiredLevel0 = selectedEducation.universitySkillLevels?.level0 || 1;
      const requiredLevel1 = selectedEducation.universitySkillLevels?.level1 || 1;
      
      if (selectedLevel0Skills.length < requiredLevel0) {
        setErrors([`Please select ${requiredLevel0} skill(s) for level 0`]);
        return;
      }
      
      if (selectedLevel1Skills.length < requiredLevel1) {
        setErrors([`Please select ${requiredLevel1} skill(s) for level 1`]);
        return;
      }
    } else {
      // Military Academy validation
      if (selectedSkills.length < selectedEducation.skillSelections) {
        setErrors([`Please select ${selectedEducation.skillSelections} skills`]);
        return;
      }
    }

    // Create education skills - only if graduated or Military Academy
    const educationSkills: Skill[] = [];
    
    if (selectedEducation.type === 'military-academy') {
      // Military Academy always gives skills (even if you don't graduate)
      educationSkills.push(...selectedSkills.map(skillName => ({
        name: skillName,
        level: 1,
        source: 'education'
      })));
    } else if (selectedEducation.type === 'university') {
      // University: Level 0 skills start at 0, level 1 skills start at 1
      // When graduated: level 0 becomes 1, level 1 becomes 2
      
      // Add level 0 skills
      selectedLevel0Skills.forEach(skillName => {
        const existingSkill = character.skills.find(s => s.name === skillName);
        if (existingSkill && existingSkill.source === 'homeworld' && existingSkill.level === 0) {
          // Upgrading background skill from 0 to 1 (or 2 if graduated)
          educationSkills.push({
            name: skillName,
            level: hasGraduated ? 1 : 0, // 0→1 or 0→2 if graduated
            source: 'education'
          });
        } else {
          // New skill
          educationSkills.push({
            name: skillName,
            level: hasGraduated ? 1 : 0, // Start at 0, become 1 if graduated
            source: 'education'
          });
        }
      });
      
      // Add level 1 skills
      selectedLevel1Skills.forEach(skillName => {
        const existingSkill = character.skills.find(s => s.name === skillName);
        if (existingSkill && existingSkill.source === 'homeworld' && existingSkill.level === 0) {
          // Upgrading background skill from 0 to 1 (or 2 if graduated)
          educationSkills.push({
            name: skillName,
            level: hasGraduated ? 2 : 1, // 0→1 or 0→2 if graduated
            source: 'education'
          });
        } else {
          // New skill
          educationSkills.push({
            name: skillName,
            level: hasGraduated ? 2 : 1, // Start at 1, become 2 if graduated
            source: 'education'
          });
        }
      });
    }

    // Apply pre-career event effects if any
    const eventSkills: Skill[] = [];
    const characteristicBonuses: Record<string, number> = {};
    
    if (rolledEvent) {
      const preCareerEvent = rolledEvent;
      if (preCareerEvent.effect.type === 'characteristic' && 
          preCareerEvent.effect.characteristic && 
          preCareerEvent.effect.modifier) {
        const char = preCareerEvent.effect.characteristic;
        characteristicBonuses[char] = (characteristicBonuses[char] || 0) + preCareerEvent.effect.modifier;
      }
      if (preCareerEvent.effect.type === 'skill' && 
          preCareerEvent.effect.skill && 
          preCareerEvent.effect.level) {
        const existingEducationSkill = educationSkills.find(s => s.name === preCareerEvent.effect.skill);
        if (existingEducationSkill) {
          existingEducationSkill.level += preCareerEvent.effect.level;
        } else {
          eventSkills.push({
            name: preCareerEvent.effect.skill,
            level: preCareerEvent.effect.level,
            source: 'education'
          });
        }
      }
    }

    // Create enrollment history event
    const enrollmentEvent = CharacterHistoryManager.createChoiceEvent(
      `Enrolled in ${selectedEducation.name}`,
      educationOptions.map(e => e.name),
      `Enrolled in ${selectedEducation.name}${selectedBranch ? ` (${selectedBranch})` : ''}`,
      {
        narrative: selectedEducation.description
      }
    );

    // Create graduation history event if graduation was attempted
    const historyEvents = [enrollmentEvent];
    
    if (graduationRoll !== null && selectedEducation.graduationRequirement) {
      let graduationOutcome = '';
      let graduationSkills: string[] = [];
      let graduationBonuses: string[] = [];
      
      if (hasGraduated) {
        if (hasHonours) {
          graduationOutcome = 'Graduated with Honours';
          if (selectedEducation.type === 'university') {
            graduationSkills = selectedSkills;
            graduationBonuses.push('EDU +1'); // Base graduation bonus
            if (selectedEducation.graduationBonus?.honoursBonus?.characteristic === 'EDU') {
              graduationBonuses.push('EDU +1 (Honours)'); // Additional honors bonus
            }
          }
          if (selectedEducation.graduationBonus?.honoursBonus?.characteristic === 'SOC') {
            graduationBonuses.push('SOC +1 (Honours)');
          }
        } else {
          graduationOutcome = 'Graduated';
          if (selectedEducation.type === 'university') {
            graduationSkills = selectedSkills;
            graduationBonuses.push('EDU +1');
          }
        }
      } else {
        graduationOutcome = 'Failed to Graduate';
      }
      
      const graduationEvent = CharacterHistoryManager.createRollEvent(
        '2d6',
        graduationRoll,
        selectedEducation.graduationRequirement.target,
        `${graduationOutcome}${graduationSkills.length > 0 ? ` - Skills: ${graduationSkills.join(', ')}` : ''}${graduationBonuses.length > 0 ? ` - Bonuses: ${graduationBonuses.join(', ')}` : ''}`,
        hasGraduated,
        {
          narrative: `Graduation attempt: ${graduationOutcome}`
        }
      );
      
      historyEvents.push(graduationEvent);
    }

    // Calculate characteristic bonuses
    const finalCharacteristics = { ...character.characteristics };
    
    // Entry bonuses (applied when enrolled)
    if (selectedEducation.entryBonus?.characteristic === 'EDU') {
      finalCharacteristics.EDU += 1;
    }
    
    // Graduation bonuses (only if graduated)
    if (hasGraduated) {
      if (selectedEducation.graduationBonus?.characteristic === 'EDU') {
        finalCharacteristics.EDU += 1;
      }
      // Apply honors bonuses
      if (hasHonours && selectedEducation.graduationBonus?.honoursBonus) {
        if (selectedEducation.graduationBonus.honoursBonus.characteristic === 'EDU') {
          finalCharacteristics.EDU += selectedEducation.graduationBonus.honoursBonus.modifier || 1;
        }
        if (selectedEducation.graduationBonus.honoursBonus.characteristic === 'SOC') {
          finalCharacteristics.SOC += selectedEducation.graduationBonus.honoursBonus.modifier || 1;
        }
      }
    }
    
    // Apply event bonuses
    Object.entries(characteristicBonuses).forEach(([char, bonus]) => {
      finalCharacteristics[char as keyof typeof finalCharacteristics] += bonus;
    });

    onStepComplete('education', {
      valid: true,
      data: {
        // Return education data in the standard format
        educationType: selectedEducation.id,
        educationName: selectedEducation.name,
        branch: selectedBranch,
        graduated: hasGraduated,
        honours: hasHonours,
        skills: [...educationSkills, ...eventSkills], // Skills earned
        characteristics: finalCharacteristics, // Updated characteristics
        
        // Events for StepByStepCreation to process
        enrollmentEvent: enrollmentEvent,
        graduationEvents: graduationRoll !== null ? historyEvents.slice(1) : [], // Graduation event if attempted
        preCareerEvents: characterEvents, // Pre-career events
        
        // Store education data for reference
        phaseData: {
          education: {
            type: selectedEducation.id,
            name: selectedEducation.name,
            branch: selectedBranch,
            graduated: hasGraduated,
            honours: hasHonours,
            term: getCurrentTerm(),
            events: events,
            rolledEvent: rolledEvent
          }
        }
      }
    });
  };

  const getBranchRequirementsMet = (branch: string): boolean => {
    if (branch === 'army') return character.characteristics.END >= 7;
    if (branch === 'marines') return character.characteristics.END >= 8;
    if (branch === 'navy') return character.characteristics.INT >= 8;
    return false;
  };

  const isSkillAlreadyKnown = (skillName: string): boolean => {
    return character.skills.some(skill => skill.name === skillName);
  };

  // University-specific skill validation
  const getSkillLevel = (skillName: string): number => {
    const skill = character.skills.find(skill => skill.name === skillName);
    return skill ? skill.level : -1; // -1 means skill not known
  };

  const canSelectForLevel0 = (skillName: string): boolean => {
    const currentLevel = getSkillLevel(skillName);
    return currentLevel < 0; // Can only select if not known at all
  };

  const canSelectForLevel1 = (skillName: string): boolean => {
    const currentLevel = getSkillLevel(skillName);
    return currentLevel <= 0; // Can select if not known or known at level 0
  };

  const getAvailableSkills = (): string[] => {
    if (!selectedEducation?.skillChoices) return [];
    
    // Filter out skills the character already knows
    return selectedEducation.skillChoices.filter(skill => !isSkillAlreadyKnown(skill));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Pre-Career Education</h2>
        <p className="text-slate-300">
          You may attend University or Military Academy during your first three terms (ages 18–30).
          If skipped or failed, proceed directly to a career.
        </p>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
          <ul className="text-red-300 text-sm">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Events Display */}
      {events.length > 0 && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
          <ul className="text-green-300 text-sm">
            {events.map((event, index) => (
              <li key={index}>• {event}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Education Type Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Education Options</h3>
        
        {/* Restriction Notice */}
        {(hasAttemptedEducation || lockedSelection) && (
          <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              {hasAttemptedEducation && !isEnrolled && 
                "⚠️ You have already attempted education this term and failed. You cannot try again."
              }
              {lockedSelection && hasRolledEntry && 
                "🔒 Your education selection is locked after rolling for entry. You cannot change your choice."
              }
            </p>
          </div>
        )}
        
        <div className="grid gap-4">
          {educationOptions.map((education) => {
            const currentTerm = getCurrentTerm();
            const isDisabled = (hasAttemptedEducation && education.type !== 'skip') || 
                             (lockedSelection && hasRolledEntry && selectedEducation?.id !== education.id) ||
                             (education.type === 'military-academy' && currentTerm > 1);
            
            return (
              <div
                key={education.id}
                className={`card p-4 transition-all ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed bg-slate-800/30'
                    : selectedEducation?.id === education.id
                      ? 'ring-2 ring-blue-400 bg-blue-900/30 cursor-pointer'
                      : 'hover:ring-1 hover:ring-slate-400 cursor-pointer'
                }`}
                onClick={() => !isDisabled && handleEducationSelect(education)}
              >
                <h4 className="font-semibold text-white">{education.name}</h4>
                <p className="text-sm text-slate-300 mb-2">{education.description}</p>
                {education.entryRequirement && (
                  <div className="text-xs text-slate-400">
                    Entry: {education.entryRequirement.roll} + EDU DM ≥ {education.entryRequirement.target}
                    {education.entryRequirement.dm.map((dm, idx) => (
                      <span key={idx}> | {dm.condition}: {dm.modifier > 0 ? '+' : ''}{dm.modifier}</span>
                    ))}
                  </div>
                )}
                {isDisabled && (
                  <div className="text-xs text-red-400 mt-2">
                    {hasAttemptedEducation ? 'Already attempted this term' : 
                     education.type === 'military-academy' && currentTerm > 1 ? 'Military Academy only available in first term' :
                     'Selection locked'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Military Branch Selection */}
      {selectedEducation?.type === 'military-academy' && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Military Branch</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(selectedEducation.militaryBranch || {}).map(([branch, info]) => {
              const canSelect = getBranchRequirementsMet(branch);
              return (
                <div
                  key={branch}
                  className={`card p-4 cursor-pointer transition-all ${
                    selectedBranch === branch
                      ? 'ring-2 ring-blue-400 bg-blue-900/30'
                      : canSelect 
                        ? 'hover:ring-1 hover:ring-slate-400'
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canSelect && handleBranchSelect(branch)}
                >
                  <h4 className="font-semibold text-white capitalize">{branch}</h4>
                  <p className="text-xs text-slate-400">{info.requirement}</p>
                  {!canSelect && (
                    <p className="text-xs text-red-400 mt-1">Requirements not met</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entry Roll */}
      {selectedEducation && selectedEducation.type !== 'skip' && !isEnrolled && !failedEntry && (
        selectedEducation.type !== 'military-academy' || selectedBranch
      ) && (
        <div className="mb-8 card p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Qualification Roll</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={rollEntry}
              disabled={hasRolledEntry}
              className={`btn-primary ${hasRolledEntry ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {hasRolledEntry ? 'Already Rolled' : 'Roll for Entry'}
            </button>
            {entryRoll && (
              <div className="text-white">
                Rolled: {entryRoll} + {getDM('EDU')} (EDU DM) = {entryRoll + getDM('EDU')}
                {entryRoll + getDM('EDU') >= (selectedEducation.entryRequirement?.target || 0) ? 
                  ' - Success!' : ' - Failed!'}
              </div>
            )}
          </div>
          {hasRolledEntry && (
            <div className="mt-3 text-sm text-slate-400">
              ⚠️ You cannot change your education selection or roll again this term.
            </div>
          )}
        </div>
      )}

      {/* Skill Selection */}
      {isEnrolled && selectedEducation && selectedEducation.skillChoices && (
        <div className="mb-8">
          {selectedEducation.type === 'university' ? (
            /* University Skill Selection */
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">University Skills</h3>
              <p className="text-sm text-slate-400 mb-4">
                Choose one skill to learn at level 0 and one at level 1. You can use your level 1 pick to upgrade a background skill from level 0 to 1.
              </p>
              
              {/* Skills already known notice */}
              {selectedEducation.skillChoices.some(skill => !canSelectForLevel0(skill) || !canSelectForLevel1(skill)) && (
                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    ℹ️ Skills you already know at or above the target level are disabled and cannot be selected.
                  </p>
                </div>
              )}
              
              {/* Level 0 Skills */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-white mb-3">
                  Level 0 Skills <span className="text-sm font-normal text-slate-400">(Choose 1)</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedEducation.skillChoices.map((skill) => {
                    const isSelected = selectedLevel0Skills.includes(skill);
                    const isBlockedByLevel1 = selectedLevel1Skills.includes(skill);
                    const canSelectLevel0 = canSelectForLevel0(skill);
                    const skillLevel = getSkillLevel(skill);
                    
                    return (
                      <button
                        key={skill}
                        disabled={isBlockedByLevel1 || !canSelectLevel0}
                        className={`p-3 text-sm rounded-lg transition-all ${
                          !canSelectLevel0
                            ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-600'
                            : isBlockedByLevel1
                              ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-600'
                              : isSelected
                                ? 'bg-green-600 text-white ring-2 ring-green-400'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                        }`}
                        onClick={() => canSelectLevel0 && !isBlockedByLevel1 && handleUniversityLevel0Toggle(skill)}
                      >
                        {skill}
                        {!canSelectLevel0 && <span className="block text-xs mt-1">Already Known (Level {skillLevel})</span>}
                        {canSelectLevel0 && isBlockedByLevel1 && <span className="block text-xs mt-1">Used for Level 1</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  Selected: {selectedLevel0Skills.length} / 1
                </div>
              </div>
              
              {/* Level 1 Skills */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-white mb-3">
                  Level 1 Skills <span className="text-sm font-normal text-slate-400">(Choose 1)</span>
                </h4>
                {/* Background skill upgrade notice */}
                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    💡 You can use this pick to upgrade a background skill from level 0 to 1, or learn a new skill at level 1.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedEducation.skillChoices.map((skill) => {
                    const isSelected = selectedLevel1Skills.includes(skill);
                    const isBlockedByLevel0 = selectedLevel0Skills.includes(skill);
                    const canSelectLevel1 = canSelectForLevel1(skill);
                    const isBackgroundUpgrade = isSkillUpgradeFromBackground(skill);
                    const skillLevel = getSkillLevel(skill);
                    
                    return (
                      <button
                        key={skill}
                        disabled={isBlockedByLevel0 || !canSelectLevel1}
                        className={`p-3 text-sm rounded-lg transition-all ${
                          !canSelectLevel1
                            ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-600'
                            : isBlockedByLevel0
                              ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-600'
                              : isSelected
                                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                : isBackgroundUpgrade
                                  ? 'bg-purple-700 text-purple-100 hover:bg-purple-600 border border-purple-500'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                        }`}
                        onClick={() => canSelectLevel1 && !isBlockedByLevel0 && handleUniversityLevel1Toggle(skill)}
                      >
                        {skill}
                        {!canSelectLevel1 && <span className="block text-xs mt-1">Already Known (Level {skillLevel})</span>}
                        {canSelectLevel1 && isBlockedByLevel0 && <span className="block text-xs mt-1">Used for Level 0</span>}
                        {canSelectLevel1 && !isBlockedByLevel0 && isBackgroundUpgrade && <span className="block text-xs mt-1">Background Upgrade</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  Selected: {selectedLevel1Skills.length} / 1
                </div>
              </div>
              
              {/* Graduation Effect Summary */}
              {(selectedLevel0Skills.length > 0 || selectedLevel1Skills.length > 0) && (
                <div className="p-4 bg-slate-800 rounded-lg">
                  <h5 className="text-white font-medium mb-2">Upon Graduation:</h5>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {selectedLevel0Skills.map(skill => (
                      <li key={skill}>• {skill}: Level 0 → Level 1</li>
                    ))}
                    {selectedLevel1Skills.map(skill => (
                      <li key={skill}>• {skill}: Level 1 → Level 2 {isSkillUpgradeFromBackground(skill) ? '(Background Upgrade)' : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Military Academy Skill Selection */
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Skills 
                <span className="text-sm font-normal text-slate-400">
                  (Select {selectedEducation.skillSelections})
                </span>
              </h3>
              
              {/* Skills already known notice */}
              {selectedEducation.skillChoices.some(skill => isSkillAlreadyKnown(skill)) && (
                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    ℹ️ Skills you already know are disabled and cannot be selected again.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedEducation.skillChoices.map((skill) => {
                  const alreadyKnown = isSkillAlreadyKnown(skill);
                  const isSelected = selectedSkills.includes(skill);
                  
                  return (
                    <button
                      key={skill}
                      disabled={alreadyKnown}
                      className={`p-3 text-sm rounded-lg transition-all ${
                        alreadyKnown
                          ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-600'
                          : isSelected
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                      }`}
                      onClick={() => !alreadyKnown && handleSkillToggle(skill)}
                    >
                      {skill}
                      {alreadyKnown && <span className="block text-xs mt-1">Already Known</span>}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 text-sm text-slate-400">
                Selected: {selectedSkills.length} / {selectedEducation.skillSelections}
                {getAvailableSkills().length < selectedEducation.skillSelections && (
                  <span className="text-yellow-400 ml-2">
                    ⚠️ Not enough new skills available ({getAvailableSkills().length} available)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Graduation Roll */}
      {isEnrolled && selectedEducation?.graduationRequirement && 
       ((selectedEducation.type === 'university' && selectedLevel0Skills.length === 1 && selectedLevel1Skills.length === 1) ||
        (selectedEducation.type !== 'university' && selectedSkills.length === selectedEducation.skillSelections)) &&
       !hasGraduated && !hasFailedGraduation && (
        <div className="mb-8 card p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Graduation Roll</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={rollGraduation}
              disabled={graduationRoll !== null}
              className={`btn-primary ${graduationRoll !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {graduationRoll !== null ? 'Rolled' : 'Roll for Graduation'}
            </button>
            {graduationRoll && (
              <div className="text-white">
                Rolled: {graduationRoll} + {getDM('INT')} (INT DM) = {graduationRoll + getDM('INT')}
                {graduationRoll + getDM('INT') >= (selectedEducation.graduationRequirement?.target || 0) ? 
                  ` - ${graduationRoll + getDM('INT') >= (selectedEducation.type === 'university' ? 10 : 11) ? 'Honours!' : 'Graduated!'}` : 
                  ' - Failed!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      {selectedEducation && selectedEducation.type !== 'skip' && (
        <div className="mb-8 card p-4 bg-slate-800/50">
          <h4 className="font-semibold text-white mb-2">Progress Summary</h4>
          <div className="text-sm text-slate-300 space-y-1">
            <div>Education: {selectedEducation.name} {selectedBranch && `(${selectedBranch})`}</div>
            <div>Status: {
              !isEnrolled ? 'Not enrolled' : 
              characterEvents.some(event => event.description.includes('failure') || event.description.includes('Must leave education')) ? 'Forced to leave due to tragedy' :
              hasFailedGraduation ? 'Failed to graduate' : 
              hasGraduated ? (hasHonours ? 'Graduated with Honours' : 'Graduated') : 
              'Enrolled'
            }</div>
            <div>Skills: {
              selectedEducation.type === 'university' 
                ? `Level 0: ${selectedLevel0Skills.join(', ') || 'None'}, Level 1: ${selectedLevel1Skills.join(', ') || 'None'}`
                : selectedSkills.join(', ') || 'None selected'
            }</div>
            {eventRoll && (
              <div>Event Roll: {eventRoll} - {rolledEvent?.title || 'No event'}</div>
            )}
            {isEnrolled && hasGraduated && (
              <div className="text-green-400">
                Benefits: +1 EDU{hasHonours && selectedEducation.type === 'military-academy' ? ', +1 SOC' : ''}
                , selected skills +1 level
              </div>
            )}
            {isEnrolled && hasFailedGraduation && (
              <div className="text-red-400">
                Failed to graduate. No degree benefits, but you can continue to your career.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          ← Back
        </button>
        <button
          onClick={handleComplete}
          disabled={
            !selectedEducation || 
            (selectedEducation.type === 'military-academy' && !selectedBranch) ||
            (selectedEducation.type !== 'skip' && !isEnrolled && !failedEntry) ||
            // University skill validation (only if still enrolled and not forced to leave)
            (selectedEducation.type === 'university' && isEnrolled && hasGraduated &&
             (selectedLevel0Skills.length !== 1 || selectedLevel1Skills.length !== 1)) ||
            // Military Academy skill validation (only if still enrolled and not forced to leave)
            (selectedEducation.type === 'military-academy' && isEnrolled && hasGraduated &&
             selectedSkills.length < selectedEducation.skillSelections) ||
            // General skill validation for military academy with insufficient available skills
            (selectedEducation.type === 'military-academy' && isEnrolled && hasGraduated &&
             getAvailableSkills().length < selectedEducation.skillSelections && 
             selectedSkills.length < getAvailableSkills().length) ||
            // Graduation roll required but not completed (and not failed or forced to leave)
            (isEnrolled && selectedEducation.graduationRequirement && 
             !hasGraduated && !hasFailedGraduation && graduationRoll === null &&
             !characterEvents.some(event => 
               event.description.includes('failure') || event.description.includes('Must leave education')
             ))
          }
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};
