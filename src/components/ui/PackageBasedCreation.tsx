/**
 * Package-Based Character Creation Component
 * Quick character creation using pre-made background packages
 * Based on Mongoose Traveller 2nd Edition Package-Based Creation rules
 */

import React, { useEffect, useState } from 'react';
import type { Character, Rules, CharacteristicSet, Skill } from '@/types';
import { CharacterHistoryManager } from '@/utils/characterHistory';
import { roll } from '@/utils/dice';

interface BackgroundPackage {
  id: string;
  name: string;
  description: string;
  characteristicModifiers: {
    characteristic: keyof CharacteristicSet;
    modifier: number;
  }[];
  skills: string[];
  benefits: string[];
  credits: number;
  equipment: string[];
  narrative: {
    background: string;
    suitableFor: string[];
  };
}

interface CareerPackage {
  id: string;
  name: string;
  description: string;
  skills: string[];
  benefits: string[];
  credits: number;
  equipment: string[];
  narrative: {
    background: string;
    personality: string[];
    motivations: string[];
  };
}

interface PackageBasedCreationProps {
  rules: Rules;
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  onComplete: (character: Character) => void;
  onBack?: () => void;
}

/**
 * ✅ STANDARDS COMPLIANT: Package-based character creation
 * - Uses same characteristic rolling as step-by-step creation
 * - Pre-configured background packages for quick creation
 * - Maintains character history tracking
 */
export const PackageBasedCreation: React.FC<PackageBasedCreationProps> = ({
  rules: _rules,
  character,
  onCharacterUpdate,
  onComplete,
  onBack,
}) => {
  const [currentStep, setCurrentStep] = useState<'characteristics' | 'background' | 'career' | 'finalize'>('characteristics');
  const [characteristics, setCharacteristics] = useState<CharacteristicSet>({
    STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7
  });
  const selectedSpecies = 'Human';
  const [selectedBackgroundPackage, setSelectedBackgroundPackage] = useState<BackgroundPackage | null>(null);
  const [selectedCareerPackage, setSelectedCareerPackage] = useState<CareerPackage | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [finalizingStep, setFinalizingStep] = useState<'review' | 'career_option' | 'skill_improvement' | 'benefits' | 'complete'>('review');
  const [skillImprovements, setSkillImprovements] = useState<{[key: string]: number}>({});
  const resetImprovementsRef = React.useRef<boolean>(false);
  const [selectedSkillImprovement, setSelectedSkillImprovement] = useState<number | null>(null);
  const [selectedCareerOption, setSelectedCareerOption] = useState<number | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<number | null>(null);
  // Career option state
  const [selectedOptionOneSkill, setSelectedOptionOneSkill] = useState<string | null>(null);
  const [selectedOptionTwoSkills, setSelectedOptionTwoSkills] = useState<string[]>([]);
  // Sub-phase inside Skill Improvement step
  const [improvementPhase, setImprovementPhase] = useState<'option' | 'dual'>('option');

  // Initialize improvement phase whenever entering the skill_improvement step
  useEffect(() => {
    if (finalizingStep === 'skill_improvement') {
      // Option 3 skips directly to dual; others start with option-specific selection
      if (selectedCareerOption === 2) {
        setImprovementPhase('dual');
      } else {
        setImprovementPhase('option');
      }
      // Clear dual selection when (re)entering the step
      setSelectedSkillImprovement(null);
    }
  }, [finalizingStep, selectedCareerOption]);
  const [characterRank, setCharacterRank] = useState<string>('Rank 0');
  const [characteristicBonuses, setCharacteristicBonuses] = useState<{[key: string]: number}>({});

  // Helper function to get final characteristic values with bonuses
  const getFinalCharacteristics = () => {
    const final: {[key: string]: number} = {};
    Object.entries(characteristics).forEach(([char, value]) => {
      // Add background package modifiers
      let backgroundModifier = 0;
      if (selectedBackgroundPackage) {
        const backgroundMod = selectedBackgroundPackage.characteristicModifiers.find(mod => mod.characteristic === char);
        if (backgroundMod) {
          backgroundModifier = backgroundMod.modifier;
        }
      }
      
      // Add benefit bonuses
      const benefitBonus = characteristicBonuses[char] || 0;
      
      final[char] = Math.min(15, Math.max(1, value + backgroundModifier + benefitBonus));
    });
    return final;
  };

  // Helper function to get background package modifiers for display
  const getBackgroundModifiers = () => {
    const modifiers: {[key: string]: number} = {};
    if (selectedBackgroundPackage) {
      selectedBackgroundPackage.characteristicModifiers.forEach(mod => {
        modifiers[mod.characteristic] = mod.modifier;
      });
    }
    return modifiers;
  };

  // Helper function to get total credits including benefits
  const getTotalCredits = () => {
    let total = 0;
    if (selectedBackgroundPackage) {
      total += selectedBackgroundPackage.credits;
    }
    if (selectedCareerPackage) {
      total += selectedCareerPackage.credits;
    }
    // Add benefit credits
    if (selectedBenefit !== null) {
      const benefitCredits = [
        0,        // 1 Ship Share
        100000,   // Cr100000 in cash
        0,        // Combat implant
        0,        // 1 Ally and 2 Contacts
        0,        // TAS Membership
        0         // SOC+1
      ];
      total += benefitCredits[selectedBenefit];
    }
    return total;
  };
  const [skillImprovementChoices, setSkillImprovementChoices] = useState<{
    skillName: string;
    currentLevel: number;
    gainedLevel: number;
    choices: string[];
    resolved: boolean;
    skillInstance: string;
    choicesWithStatus: { specialization: string; status: 'new' | 'levelup' | 'blocked'; reason: string; existingLevel: number }[];
}[]>([]);
  const [characterAge, setCharacterAge] = useState<number | null>(null);
  const [skillChoices, setSkillChoices] = useState<{
    skillName: string;
    currentLevel: number;
    gainedLevel: number;
    choices: string[];
    resolved: boolean;
    skillInstance: string;
    choicesWithStatus: { specialization: string; status: 'new' | 'levelup' | 'blocked'; reason: string; existingLevel: number }[];
  }[]>([]);
  const [showSkillChoiceModal, setShowSkillChoiceModal] = useState(false);

  // Official background packages from Mongoose Traveller 2nd Edition
  const backgroundPackages: BackgroundPackage[] = [
    {
      id: 'belter',
      name: 'Belter',
      description: 'Available to Travellers who spent their early years in a belter community or similar environment, such as a remote outpost on a gas giant moon or an undeveloped rockball planet.',
      characteristicModifiers: [
        { characteristic: 'STR', modifier: -1 },
        { characteristic: 'DEX', modifier: 1 },
        { characteristic: 'EDU', modifier: -1 }
      ],
      skills: [
        'Profession (belter)-2', 'Jack-of-All-Trades-1', 'Vacc Suit-1', 'Astrogation-0',
        'Carouse-0', 'Electronics-0', 'Mechanic-0', 'Medic-0', 'Recon-0', 'Science-0'
      ],
      benefits: ['Cr2500'],
      credits: 2500,
      equipment: ['Vacc Suit'],
      narrative: {
        background: 'Grew up in the harsh environment of asteroid belts or remote outposts, learning to be self-sufficient and resourceful.',
        suitableFor: ['Scout', 'Merchant', 'Free Trader', 'Anyone who grew up in space']
      }
    },
    {
      id: 'colonist',
      name: 'Colonist',
      description: 'Available to Travellers who hail from frontier and underdeveloped regions of more settled ones. The frontier homeworld must be at least marginally habitable.',
      characteristicModifiers: [
        { characteristic: 'END', modifier: 1 },
        { characteristic: 'EDU', modifier: -1 }
      ],
      skills: [
        'Survival-2', 'Athletics (strength)-1', 'Jack-of-All-Trades-1', 'Gun Combat (slug)-1',
        'Animals-0', 'Drive-0', 'Mechanic-0', 'Medic-0', 'Navigation-0', 'Profession-0', 'Recon-0'
      ],
      benefits: ['Cr5000'],
      credits: 5000,
      equipment: ['Rifle or Carbine'],
      narrative: {
        background: 'Raised on frontier worlds where survival skills and self-reliance were essential for daily life.',
        suitableFor: ['Scout', 'Army', 'Marine', 'Anyone from frontier worlds']
      }
    },
    {
      id: 'developed_world',
      name: 'Developed World',
      description: 'Available to Travellers who grew up in a relatively civilised environment such as a city on a mid- or high-tech world.',
      characteristicModifiers: [
        { characteristic: 'EDU', modifier: 1 }
      ],
      skills: [
        'Admin-1', 'Electronics (comms or computers)-1', 'Profession (any)-1', 'Drive (wheel)-1',
        'Science (any)-1', 'Art-0', 'Advocate-0', 'Diplomat-0', 'Flyer-0', 'Streetwise-0'
      ],
      benefits: ['Cr10000'],
      credits: 10000,
      equipment: ['Portable Computer'],
      narrative: {
        background: 'Grew up in urban environments with access to education and technology, developing sophisticated skills.',
        suitableFor: ['Any career', 'Especially suitable for technical or social careers']
      }
    },
    {
      id: 'fringe',
      name: 'Fringe',
      description: 'Available to Travellers who grew up on the fringes of a mid- or high-tech society. They may not necessarily be criminals but will have lived in a world where crime (and violence) is common.',
      characteristicModifiers: [
        { characteristic: 'DEX', modifier: 1 },
        { characteristic: 'EDU', modifier: -2 },
        { characteristic: 'SOC', modifier: -2 }
      ],
      skills: [
        'Streetwise-2', 'Athletics (dexterity)-1', 'Deception-1', 'Melee (unarmed)-1',
        'Gambler-0', 'Gun Combat-0', 'Recon-0', 'Stealth-0'
      ],
      benefits: ['Cr1000'],
      credits: 1000,
      equipment: ['Blade'],
      narrative: {
        background: 'Survived on the dangerous fringes of society, learning to navigate criminal underworlds and violent streets.',
        suitableFor: ['Rogue', 'Drifter', 'Agent', 'Anyone from dangerous urban areas']
      }
    },
    {
      id: 'low_tech',
      name: 'Low-Tech',
      description: 'Available to any Traveller who grew up in a TL3 or lower society. This could be a frontier or backwater area of a more developed world if the Traveller belonged to a minority group.',
      characteristicModifiers: [
        { characteristic: 'EDU', modifier: -3 },
        { characteristic: 'END', modifier: 2 }
      ],
      skills: [
        'Language (local dialect)-2', 'Profession (any survival)-2', 'Survival-1', 'Animals (any)-1',
        'Athletics-0', 'Carouse-0', 'Gun Combat (archaic)-1', 'Melee (any)-1', 'Navigation-0',
        'Recon-0', 'Steward-0', 'Streetwise-0'
      ],
      benefits: ['Cr5000'],
      credits: 5000,
      equipment: ['Blade, Club or Dagger'],
      narrative: {
        background: 'Raised in a low-technology society, developing strong survival instincts and traditional skills.',
        suitableFor: ['Scout', 'Drifter', 'Barbarian', 'Anyone from primitive worlds']
      }
    },
    {
      id: 'metropolis',
      name: 'Metropolis',
      description: 'Available to Travellers who grew up in a high population density environment, such as a high-population world or very crowded city.',
      characteristicModifiers: [
        { characteristic: 'STR', modifier: -1 },
        { characteristic: 'EDU', modifier: 2 },
        { characteristic: 'END', modifier: 1 }
      ],
      skills: [
        'Profession (any)-2', 'Admin-1', 'Diplomat-1', 'Electronics (comms or computers)-1',
        'Streetwise-1', 'Advocate-0', 'Broker-0', 'Carouse-0', 'Drive-0'
      ],
      benefits: ['Cr10000'],
      credits: 10000,
      equipment: ['Portable Computer'],
      narrative: {
        background: 'Grew up in densely populated urban centers, learning to navigate complex social and bureaucratic systems.',
        suitableFor: ['Citizen', 'Noble', 'Agent', 'Anyone from high-population worlds']
      }
    },
    {
      id: 'space_habitat',
      name: 'Space Habitat',
      description: 'Available to Travellers who grew up in \'a city in space\' or aboard a starship. Denizens of orbital cities or those whose family worked at a highport should use this package.',
      characteristicModifiers: [
        { characteristic: 'STR', modifier: -1 },
        { characteristic: 'DEX', modifier: 1 },
        { characteristic: 'END', modifier: -1 }
      ],
      skills: [
        'Athletics (dexterity)-1', 'Electronics (any)-1', 'Engineer (life support)-1', 'Profession (any)-1',
        'Admin-0', 'Astrogation-0', 'Mechanic-0', 'Science-0', 'Steward-0', 'Vacc Suit-0'
      ],
      benefits: ['Cr5000'],
      credits: 5000,
      equipment: ['Vacc Suit'],
      narrative: {
        background: 'Raised in artificial environments of space stations or generation ships, developing technical skills and space adaptation.',
        suitableFor: ['Navy', 'Merchant', 'Scout', 'Anyone who grew up in space habitats']
      }
    },
    {
      id: 'water_world',
      name: 'Water World',
      description: 'Available to Travellers who grew up on very wet worlds (Hydrographics code 9 or 10), in contact with the natural environment of the world.',
      characteristicModifiers: [
        { characteristic: 'END', modifier: 1 }
      ],
      skills: [
        'Seafarer (any)-2', 'Navigation-1', 'Profession (any)-1', 'Recon-1', 'Admin-0',
        'Athletics-0', 'Carouse-0', 'Electronics-0', 'Survival-0'
      ],
      benefits: ['Cr5000'],
      credits: 5000,
      equipment: [],
      narrative: {
        background: 'Grew up on ocean worlds, developing strong swimming abilities and maritime navigation skills.',
        suitableFor: ['Navy', 'Scout', 'Merchant Marine', 'Anyone from high-hydrographic worlds']
      }
    }
  ];

  // Official career packages from Mongoose Traveller 2nd Edition
  const careerPackages: CareerPackage[] = [
    {
      id: 'administrator',
      name: 'Administrator',
      description: 'The Traveller worked in a bureaucratic or managerial capacity for a large organisation. This could be a shipping line, planetary government, or megacorporation.',
      skills: ['Admin-1', 'Advocate-1', 'Broker-1', 'Carouse-1', 'Diplomat-1', 'Electronics (computers)-1', 'Art-0', 'Drive-0', 'Leadership-0', 'Profession-0', 'Science-0'],
      benefits: ['Rank 2 (senior manager)', 'Cr75000', '3 Contacts (former colleagues)'],
      
      credits: 75000,
      equipment: [],
      narrative: {
        background: 'Worked in bureaucratic or managerial capacity for large organisations, gaining experience in administration and corporate politics.',
        personality: ['Organised', 'Diplomatic', 'Detail-Oriented'],
        motivations: ['Maintain Order', 'Build Networks', 'Advance Career']
      }
    },
    {
      id: 'agent',
      name: 'Agent',
      description: 'The Traveller has worked for an intelligence or law enforcement agency, primarily gathering information and working by covert means.',
      skills: ['Streetwise-2', 'Investigate-2', 'Carouse-1', 'Deception-1', 'Electronics (comms)-1', 'Persuade-1', 'Recon-1', 'Stealth-1', 'Advocate-0', 'Drive-0', 'Gun Combat-0'],
      benefits: ['Rank 2 (field agent)', 'Cr25000', '3 Contacts (former informants or colleagues)'],
      
      credits: 25000,
      equipment: ['Pistol'],
      narrative: {
        background: 'Worked for intelligence or law enforcement agency, specializing in covert operations and information gathering.',
        personality: ['Observant', 'Secretive', 'Adaptable'],
        motivations: ['Uncover Truth', 'Serve Justice', 'Protect Society']
      }
    },
    {
      id: 'barbarian',
      name: 'Barbarian',
      description: 'The Traveller comes from a very low-tech society or one so undeveloped that technological items are rarely available.',
      skills: ['Melee (blade)-2', 'Survival-2', 'Animals (any)-1', 'Language (any suitable)-1', 'Recon-1', 'Stealth-1', 'Athletics (any)-0', 'Carouse-0', 'Navigation-0', 'Stealth-0', 'Seafarer-0'],
      benefits: ['Rank 2 (warrior)', 'Cr1000'],
      
      credits: 1000,
      equipment: ['Blade or Staff'],
      narrative: {
        background: 'Comes from very low-tech society where technological items are rare. Skilled in traditional combat and survival.',
        personality: ['Hardy', 'Traditional', 'Direct'],
        motivations: ['Honor the Ancestors', 'Protect the Tribe', 'Prove Worth']
      }
    },
    {
      id: 'citizen',
      name: 'Citizen',
      description: 'The Traveller has lived a comfortable life in a mid to high technology society, with few opportunities for adventure or excitement.',
      skills: ['Profession (any)-2', 'Admin-1', 'Drive (any)-1', 'Electronics (computer)-1', 'Flyer (any)-1', 'Science (any)-1', 'Streetwise-1', 'Advocate-0', 'Art-0', 'Carouse-0', 'Deception-0', 'Diplomat-0', 'Mechanic-0', 'Medic-0', 'Persuade-0'],
      benefits: ['Cr30000', '2 Contacts (former friends or business associates)'],
      
      credits: 30000,
      equipment: [],
      narrative: {
        background: 'Lived a comfortable life in mid to high technology society with few opportunities for adventure, preparing for a life of routine before circumstances changed.',
        personality: ['Comfortable', 'Educated', 'Unprepared for Danger'],
        motivations: ['Seek Stability', 'Maintain Comfort', 'Avoid Conflict']
      }
    },
    {
      id: 'corsair',
      name: 'Corsair',
      description: 'The Traveller served aboard a pirate or privateering starship, or perhaps an aggressive smuggling ship. His skills are a mix of ship operations and combat.',
      skills: ['Vacc Suit-2', 'Athletics (dexterity)-1', 'Gun Combat (any)-1', 'Gunner-1', 'Electronics (any)-1', 'Mechanic-1', 'Melee (any)-1', 'Deception-0', 'Engineer-0', 'Explosives-0', 'Medic-0', 'Recon-0', 'Streetwise-0'],
      benefits: ['Rank 2 (corporal)', 'Cr10000', '2 Contacts (former crew members)'],
      
      credits: 10000,
      equipment: ['Submachinegun (or similar close combat weapon)'],
      narrative: {
        background: 'Served aboard pirate or privateering starship, learning ship operations and combat in the dangerous world of space piracy.',
        personality: ['Aggressive', 'Opportunistic', 'Loyal to Crew'],
        motivations: ['Seek Fortune', 'Live Free', 'Protect Crew']
      }
    },
    {
      id: 'marine',
      name: 'Marine',
      description: 'The Traveller is a former member of a spacegoing military or mercenary unit, trained for shipboard action or planetside operations requiring protective equipment.',
      skills: ['Gun Combat (any)-2', 'Vacc Suit-2', 'Gunner-1', 'Melee (blade)-1', 'Athletics-0', 'Electronics-0', 'Explosives-0', 'Heavy Weapons-0', 'Medic-0', 'Recon-0'],
      benefits: ['Rank 2 (corporal)', 'Cr35000', '2 Contacts (former unit members or crew)'],
      
      credits: 35000,
      equipment: ['Assault Rifle'],
      narrative: {
        background: 'Former member of spacegoing military or mercenary unit, trained for shipboard action and planetside operations in hostile environments.',
        personality: ['Disciplined', 'Tactical', 'Team-Oriented'],
        motivations: ['Complete Mission', 'Protect Unit', 'Maintain Honor']
      }
    },
    {
      id: 'medic',
      name: 'Medic',
      description: 'Most medical professionals settle down to a sedentary and well-paid life, but some instead choose to travel. Their reasons vary from altruism or a desire to see the universe, to a need to stay one step ahead of a malpractice suit.',
      skills: ['Medic-3', 'Admin-2', 'Electronics (computer)-1', 'Investigate-1', 'Profession-1', 'Science (any)-1', 'Advocate-0', 'Diplomat-0', 'Drive-0', 'Flyer-0'],
      benefits: ['Cr50000', '2 Contacts (in the medical field or patients)'],
      
      credits: 50000,
      equipment: ['Medikit'],
      narrative: {
        background: 'Medical professional who chose to travel rather than settle into sedentary practice, bringing healing skills to those who need them most.',
        personality: ['Compassionate', 'Analytical', 'Dedicated'],
        motivations: ['Help Others', 'Advance Medical Knowledge', 'Stay Mobile']
      }
    },
    {
      id: 'military_enlisted',
      name: 'Military (Enlisted)',
      description: 'The Traveller is former soldier, familiar with many weapon systems and military operations. His service might have been with a major interstellar army, a planetary army, a mercenary force, or a colonial militia.',
      skills: ['Gun Combat (any)-3', 'Athletics (endurance)-1', 'Explosives-1', 'Recon-1', 'Heavy Weapons-1', 'Medic-0', 'Drive-0', 'Electronics-0', 'Medic-0', 'Melee-0', 'Stealth-0'],
      benefits: ['Rank 2 (corporal)', 'Cr25000', '1 Ally (former unit buddy)'],
      
      credits: 25000,
      equipment: ['Assault Rifle'],
      narrative: {
        background: 'Former soldier with extensive weapons training and military operations experience, served in various military forces.',
        personality: ['Tough', 'Reliable', 'Combat-Ready'],
        motivations: ['Serve with Honor', 'Protect Civilians', 'Complete Mission']
      }
    },
    {
      id: 'military_officer',
      name: 'Military (Officer)',
      description: 'The Traveller is a former officer in an armed force of some kind. This may be a formally organised army or paramilitary group, militia, or mercenary force.',
      skills: ['Leadership-2', 'Admin-1', 'Diplomat-1', 'Gun Combat (any)-1', 'Tactics (military)-1', 'Athletics (endurance)-1', 'Recon-1', 'Drive-0', 'Electronics-0', 'Medic-0', 'Stealth-0'],
      benefits: ['Rank 2 (captain)', 'Cr60000', '1 Contact (former colleague or subordinate)'],
      
      credits: 60000,
      equipment: ['Gauss Pistol'],
      narrative: {
        background: 'Former officer in armed forces with leadership and tactical training, experienced in commanding troops and military operations.',
        personality: ['Authoritative', 'Strategic', 'Responsible'],
        motivations: ['Lead by Example', 'Maintain Order', 'Protect Subordinates']
      }
    },
    {
      id: 'noble',
      name: 'Noble',
      description: 'The Traveller is a member of the elite social classes, which may or may not be explicitly nobility. The Traveller must have SOC 10+ to take this background option.',
      skills: ['Leadership-2', 'Diplomat-2', 'Admin-1', 'Advocate-1', 'Carouse-1', 'Persuade-1', 'Art-0', 'Broker-0', 'Deception-0', 'Gambler-0'],
      benefits: ['Minor noble title such as Knight, Dame, or Ritter', 'Cr100000', '3 Contacts (nobles, administrators or military)'],
      
      credits: 100000,
      equipment: [],
      narrative: {
        background: 'Member of elite social classes with noble title and high social standing, experienced in leadership and diplomatic affairs.',
        personality: ['Aristocratic', 'Diplomatic', 'Influential'],
        motivations: ['Maintain Social Status', 'Exercise Influence', 'Honor Family Name']
      }
    },
    {
      id: 'performer',
      name: 'Performer',
      description: 'The Traveller makes a living from some kind of performance, be it dance, acting, music, or something far more exotic. The Traveller might be an itinerant busker or concert pianist, a renowned vid star or professional extra in local performances.',
      skills: ['Art (any)-3', 'Carouse-2', 'Deception-1', 'Persuade-1', 'Streetwise-1', 'Steward-1', 'Athletics-0', 'Broker-0', 'Gambler-0', 'Profession-0'],
      benefits: ['Cr10000', '3 Contacts'],
      
      credits: 10000,
      equipment: [],
      narrative: {
        background: 'Professional performer who made a living through artistic expression, whether as street busker or renowned entertainer.',
        personality: ['Creative', 'Charismatic', 'Expressive'],
        motivations: ['Artistic Expression', 'Entertain Others', 'Achieve Fame']
      }
    },
    {
      id: 'rogue',
      name: 'Rogue',
      description: 'The Traveller has made a career, or at least a living, on the fringes of society. His actions might not actually be illegal but are generally disreputable. Most rogues are willing to undertake at least mildly illegal actions; some are notorious criminals.',
      skills: ['Stealth-2', 'Streetwise-2', 'Deception-1', 'Gambler-1', 'Melee (any)-1', 'Recon-1', 'Athletics-0', 'Electronics-0', 'Gun Combat-0', 'Persuade-0'],
      benefits: ['Cr10000', '2 Contacts (underworld connections)'],
      
      credits: 10000,
      equipment: [],
      narrative: {
        background: 'Made a living on the fringes of society through disreputable or illegal means, developing skills in stealth and deception.',
        personality: ['Cunning', 'Opportunistic', 'Streetwise'],
        motivations: ['Easy Money', 'Avoid Authority', 'Survive by Wits']
      }
    },
    {
      id: 'scholar',
      name: 'Scholar',
      description: 'The Traveller\'s career revolved around discovery and obtaining knowledge. They may have been a field researcher, a theoretical scientist, or perhaps just someone whose curiosity led them far from home.',
      skills: ['Science (any)-3', 'Investigate-2', 'Electronics (computers)-1', 'Science (any)-1', 'Persuade-1', 'Art-0', 'Diplomat-0', 'Drive-0', 'Medic-0', 'Navigation-0', 'Profession-0'],
      benefits: ['Cr50000', '3 Contacts (academics or publishing professionals)'],
      
      credits: 50000,
      equipment: [],
      narrative: {
        background: 'Career focused on discovery and knowledge acquisition, whether as field researcher, theoretical scientist, or curious explorer.',
        personality: ['Intellectual', 'Curious', 'Methodical'],
        motivations: ['Advance Knowledge', 'Make Discoveries', 'Understand the Universe']
      }
    },
    {
      id: 'scout',
      name: 'Scout',
      description: 'The Traveller served aboard an exploration or survey starship, gaining a broad selection of shipboard and problem-solving skills.',
      skills: ['Astrogation-1', 'Pilot (starship)-1', 'Electronics (computers)-1', 'Engineer (any)-1', 'Jack-of-all-Trades-1', 'Streetwise-1', 'Vacc Suit-1', 'Carouse-0', 'Drive-0', 'Gun Combat-0', 'Medic-0', 'Investigate-0', 'Recon-0'],
      benefits: ['Cr25000', '3 Contacts (spacers or contacts on distant worlds)'],
      
      credits: 25000,
      equipment: [],
      narrative: {
        background: 'Served aboard exploration or survey starship, developing broad shipboard skills and problem-solving abilities.',
        personality: ['Adventurous', 'Self-Reliant', 'Adaptable'],
        motivations: ['Explore the Unknown', 'Map New Worlds', 'Push Boundaries']
      }
    },
    {
      id: 'spacer_crew',
      name: 'Spacer (Crew)',
      description: 'The Traveller was a crewmember on a naval or commercial starship, working in the technical and supporting branches of the crew rather than flying the ship.',
      skills: ['Vacc Suit-3', 'Athletics (any)-1', 'Electronics (any)-1', 'Engineer (any)-1', 'Mechanic-1', 'Steward-1', 'Gunner-0', 'Pilot-0', 'Medic-0', 'Persuade-0'],
      benefits: ['Cr35000', '2 Contacts (crewmates or portside starport)'],
      
      credits: 35000,
      equipment: [],
      narrative: {
        background: 'Crewmember on naval or commercial starship, specializing in technical and support operations rather than piloting.',
        personality: ['Technical', 'Reliable', 'Team-Oriented'],
        motivations: ['Master Technical Skills', 'Support the Crew', 'Keep Ships Running']
      }
    },
    {
      id: 'spacer_command',
      name: 'Spacer (Command)',
      description: 'The Traveller was an officer aboard a naval or commercial starship, serving as part of the bridge or flight crew.',
      skills: ['Pilot (starship)-2', 'Admin-1', 'Astrogation-1', 'Electronics (sensors)-1', 'Gunner-1', 'Vacc Suit-1', 'Advocate-0', 'Broker-0', 'Leadership-0', 'Persuade-0', 'Tactics-0'],
      benefits: ['Rank 2 (lieutenant or 4th officer)', 'Cr75000', '1 Ally (former colleague or government official)'],
      
      credits: 75000,
      equipment: [],
      narrative: {
        background: 'Officer aboard naval or commercial starship, serving on bridge or as flight crew with command responsibilities.',
        personality: ['Authoritative', 'Professional', 'Space-Experienced'],
        motivations: ['Command Excellence', 'Safe Navigation', 'Crew Leadership']
      }
    },
    {
      id: 'wanderer',
      name: 'Wanderer',
      description: 'A wanderer is essentially a spacegoing bum, moving from one world to another. The wanderer may be searching for something or trying to leave something behind. Wanderers tend to pick up useful shipboard skills from working passage aboard starships, or professional skills from their odd jobs.',
      skills: ['Streetwise-2', 'Melee (unarmed)-1', 'Recon-1', 'Stealth-1', 'Steward-1', 'Vacc Suit-1', 'Carouse-0', 'Deception-0', 'Drive-0', 'Gun Combat-0', 'Mechanic-0', 'Profession-0', 'Survival-0'],
      benefits: ['Cr2500', '3 Contacts and 1 Ally'],
      
      credits: 2500,
      equipment: [],
      narrative: {
        background: 'Spacegoing wanderer who moved from world to world, picking up skills from odd jobs and working passage on starships.',
        personality: ['Independent', 'Resourceful', 'Restless'],
        motivations: ['Keep Moving', 'Find Purpose', 'Escape the Past']
      }
    }
  ];

  // Roll all characteristics at once (same as step-by-step creation)
  const rollCharacterAge = (): void => {
    const ageRoll = roll('3d6');
    const finalAge = 22 + ageRoll.total;
    setCharacterAge(finalAge);

    // Create age roll event
    const ageEvent = CharacterHistoryManager.createMilestoneEvent(
      `Determined character age: ${finalAge} years old`,
      `Rolled 3d6 (${ageRoll.total}) + 22 base age = ${finalAge} years old. Ready to begin their adventuring career.`,
      {
        narrative: `At ${finalAge} years old, they began their adventuring career with the wisdom of experience and the vigor of youth.`
      },
      {
        significance: 'minor' as const,
        themes: ['age_determination', 'package_creation']
      }
    );

    setEvents(prev => [...prev, ageEvent]);
  };

  // Removed roller entirely; references have been eliminated from the UI.



  const handleBackgroundPackageSelect = (pkg: BackgroundPackage): void => {
    setSelectedBackgroundPackage(pkg);

    // Check for skill specialization choices in background package
    const { choices } = combineSkillsWithChoices(pkg.skills, []);
    
    if (choices.length > 0) {
      setSkillChoices(choices.map(choice => ({ ...choice, resolved: false })));
      setShowSkillChoiceModal(true);
    }

    // Apply background package characteristic modifiers
    // Note: Characteristic modifiers are now applied in getFinalCharacteristics() 
    // to avoid double-applying them. The base characteristics remain unchanged.

    // Create background package selection event
    const packageEvent = CharacterHistoryManager.createChoiceEvent(
      pkg.name,
      backgroundPackages.map(p => p.name).filter(name => name !== pkg.name),
      `Selected ${pkg.name} background package`,
      {
        characteristics: characteristics,
        narrative: pkg.narrative.background
      },
      {
        reasoning: 'Chose background package that matches character upbringing',
        consequences: 'This background provides characteristic modifiers and foundational skills',
        emotionalTone: 'positive' as const
      }
    );

    setEvents(prev => [...prev, packageEvent]);
  };

  // Build Foundry VTT (twodsix) JSON from the finalized character
  type FvttSkillMeta = { id?: string; name?: string; groupLabel?: string; description?: string; shortdescr?: string };
  const buildFoundryExport = (catalog?: Record<string, FvttSkillMeta>, baseExample?: any) => {
    if (!selectedBackgroundPackage || !selectedCareerPackage) return null;

    // Final characteristics with modifiers and benefits
    const finalChars = getFinalCharacteristics() as unknown as CharacteristicSet;

    // Helper to map to FVTT keys
    const charMap: {[k: string]: number} = {
      strength: finalChars.STR,
      dexterity: finalChars.DEX,
      endurance: finalChars.END,
      intelligence: finalChars.INT,
      education: finalChars.EDU,
      socialStanding: finalChars.SOC,
    } as any;

    // Build skills with final levels (>=0 only)
    const finalSkills = (() => {
      const combined = combineSkills(selectedBackgroundPackage.skills, selectedCareerPackage.skills)
        .map(s => ({
          name: s.name,
          level: Math.min(4, s.level + (skillImprovements[s.name] || 0)),
        }));

      // Add improvement-only skills not originally present
      const set = new Set(combined.map(s => s.name));
      Object.entries(skillImprovements).forEach(([name, inc]) => {
        if (!set.has(name)) {
          combined.push({ name, level: Math.min(4, inc) });
        }
      });

      return combined
        .filter(s => s.level >= 0)
        .sort((a, b) => a.name.localeCompare(b.name));
    })();

    const skillItems = finalSkills.map((s, idx) => {
      const meta = catalog?.[s.name];
      return ({
      type: 'skills',
      name: meta?.name || s.name,
      system: {
        value: s.level,
        characteristic: 'NONE',
        type: 'skills',
        description: meta?.description || '',
        shortdescr: meta?.shortdescr || '',
        subtype: '',
        key: 'key',
        difficulty: 'Average',
        rolltype: 'Normal',
        trainingNotes: '',
        groupLabel: meta?.groupLabel || s.name.split(' (')[0],
        name: meta?.name || s.name,
        priorType: 'unknown',
        prereq: ''
      },
      flags: {},
      img: 'icons/svg/mystery-man.svg',
      effects: [],
      folder: null,
      sort: (idx + 1) * 100000,
      ownership: { default: 0 },
      _stats: {},
      _id: meta?.id || undefined
    });
    });

    // Start from example template if provided; else minimal baseline
    const exportObj: any = baseExample ? JSON.parse(JSON.stringify(baseExample)) : {
      name: 'Traveller',
      type: 'traveller',
      img: 'systems/twodsix/assets/icons/default_actor.png',
      system: {},
      items: [],
      prototypeToken: {}, effects: [], folder: null, sort: 0, ownership: { default: 0 }, flags: {}
    };

    // Overwrite dynamic fields in system
    exportObj.name = character?.name || exportObj.name || 'Traveller';
    exportObj.system = exportObj.system || {};
    exportObj.system.name = character?.name || exportObj.system.name || '';
    exportObj.system.characteristics = {
      strength: { key: 'strength', value: charMap.strength, damage: 0, label: 'Strength', shortLabel: 'STR', displayShortLabel: '' },
      dexterity: { key: 'dexterity', value: charMap.dexterity, damage: 0, label: 'Dexterity', shortLabel: 'DEX', displayShortLabel: '' },
      endurance: { key: 'endurance', value: charMap.endurance, damage: 0, label: 'Endurance', shortLabel: 'END', displayShortLabel: '' },
      intelligence: { key: 'intelligence', value: charMap.intelligence, damage: 0, label: 'Intelligence', shortLabel: 'INT', displayShortLabel: '' },
      education: { key: 'education', value: charMap.education, damage: 0, label: 'Education', shortLabel: 'EDU', displayShortLabel: '' },
      socialStanding: { key: 'socialStanding', value: charMap.socialStanding, damage: 0, label: 'SocialStanding', shortLabel: 'SOC', displayShortLabel: '' }
    };
    exportObj.system.age = { value: characterAge || 0, min: 0 };
    exportObj.system.finances = { cash: String(getTotalCredits()), pension: '0', payments: '0', debt: '0', livingCosts: '0', 'financial-notes': '' };
    exportObj.system.financeValues = { cash: getTotalCredits(), pension: 0, payment: 0, debt: 0, livingCosts: 0 };
    exportObj.system.species = selectedSpecies;
    
    // Set homeworld to background name
    exportObj.system.homeWorld = selectedBackgroundPackage?.name || '';
    
    // Build notes with all benefits, rank, and equipment
    const notes = [];
    
    // Add background and career
    if (selectedBackgroundPackage?.name) {
      notes.push(`Background: ${selectedBackgroundPackage.name}`);
    }
    if (selectedCareerPackage?.name) {
      notes.push(`Career: ${selectedCareerPackage.name}`);
    }
    
    // Add rank
    if (characterRank) {
      notes.push(`Rank: ${characterRank}`);
    }
    
    // Add all benefits
    const allBenefits = [];
    if (selectedBackgroundPackage?.benefits) {
      allBenefits.push(...selectedBackgroundPackage.benefits);
    }
    if (selectedCareerPackage?.benefits) {
      allBenefits.push(...selectedCareerPackage.benefits);
    }
    if (selectedBenefit !== null && selectedCareerPackage?.benefits?.[selectedBenefit]) {
      allBenefits.push(selectedCareerPackage.benefits[selectedBenefit]);
    }
    
    if (allBenefits.length > 0) {
      notes.push('Benefits:');
      allBenefits.forEach(benefit => {
        notes.push(`- ${benefit}`);
      });
    }
    
    // Add equipment (if any)
    const equipment = [];
    if (selectedBackgroundPackage?.equipment) {
      equipment.push(...selectedBackgroundPackage.equipment);
    }
    if (selectedCareerPackage?.equipment) {
      equipment.push(...selectedCareerPackage.equipment);
    }
    
    if (equipment.length > 0) {
      notes.push('Equipment:');
      equipment.forEach(item => {
        notes.push(`- ${item}`);
      });
    }
    
    // Set notes field
    exportObj.system.description = notes.join('\n');

    // Build items: keep only Untrained from template, then append our skills
    const baseItems: any[] = Array.isArray(exportObj.items) ? exportObj.items : [];
    const untrained = baseItems.find(it => it?.flags?.twodsix?.untrainedSkill) || {
      name: 'Untrained', type: 'skills', _id: 'untrained',
      system: { characteristic: 'NONE', name: '', description: '', type: '', priorType: 'unknown', value: -3, shortdescr: '', subtype: '', prereq: '', key: 'key', difficulty: 'Average', rolltype: 'Normal', trainingNotes: '', groupLabel: '' },
      flags: { twodsix: { untrainedSkill: true } }, img: './systems/twodsix/assets/icons/jack-of-all-trades.svg', effects: [], folder: null, sort: 0, _stats: {}, ownership: { default: 0 }
    };
    exportObj.items = [untrained, ...skillItems];

    return exportObj;
  };

  const exportToFoundry = async () => {
    let catalog: Record<string, FvttSkillMeta> | undefined = undefined;
    let baseExample: any | undefined = undefined;
    try {
      // Try to load the canonical example from the public root if present
      const resp = await fetch('/fvtt-Example.json');
      if (resp.ok) {
        const data = await resp.json();
        baseExample = data;
        const items: any[] = Array.isArray(data?.items) ? data.items : [];
        catalog = {};
        items.filter(it => it?.type === 'skills').forEach(it => {
          const name: string = it?.name;
          if (!name) return;
          catalog![name] = {
            id: it?._id,
            name: it?.name,
            groupLabel: it?.system?.groupLabel,
            description: it?.system?.description,
            shortdescr: it?.system?.shortdescr
          };
        });
      }
    } catch {}

    const obj = buildFoundryExport(catalog, baseExample);
    if (!obj) return;
    const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', (character?.name || 'traveller') + '-fvtt.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCareerPackageSelect = (pkg: CareerPackage): void => {
    setSelectedCareerPackage(pkg);

    // Extract rank from career package benefits
    const rankBenefit = pkg.benefits.find(benefit => benefit.toLowerCase().includes('rank'));
    if (rankBenefit) {
      // Extract rank number from benefit text (e.g., "Rank 2 (senior manager)" -> "Rank 2")
      const rankMatch = rankBenefit.match(/rank\s+(\d+)/i);
      if (rankMatch) {
        setCharacterRank(`Rank ${rankMatch[1]}`);
      }
    } else {
      // Default rank if no rank specified in benefits
      setCharacterRank('Rank 0');
    }

    // Clear any previous career skill choices when selecting a new career
    setSkillChoices(prev => prev.filter(choice => choice.skillInstance.includes('background')));

    // Check for skill specialization choices
    if (selectedBackgroundPackage) {
      const { choices } = combineSkillsWithChoices(selectedBackgroundPackage.skills, pkg.skills);
      
      if (choices.length > 0) {
        setSkillChoices(prev => [...prev, ...choices.map(choice => ({ ...choice, resolved: false }))]);
        setShowSkillChoiceModal(true);
      }
    } else {
      // If no background package selected yet, check career package alone
      const { choices } = combineSkillsWithChoices([], pkg.skills);
      
      if (choices.length > 0) {
        setSkillChoices(choices.map(choice => ({ ...choice, resolved: false })));
        setShowSkillChoiceModal(true);
      }
    }

    // Create career package selection event
    const careerEvent = CharacterHistoryManager.createChoiceEvent(
      pkg.name,
      careerPackages.map(p => p.name).filter(name => name !== pkg.name),
      `Selected ${pkg.name} career package`,
      {
        narrative: pkg.narrative.background
      },
      {
        reasoning: 'Chose career package that matches desired professional path',
        consequences: 'This career provides advanced skills, equipment, and professional background',
        emotionalTone: 'positive' as const
      }
    );

    setEvents(prev => [...prev, careerEvent]);
  };

  // Enhanced skill system with specialization support
  interface SkillEntry {
    baseSkill: string;
    specialization?: string;
    level: number;
    source: string;
    displayName: string;
    originalString?: string;
  }

  const parseSkillString = (skillString: string): { baseSkill: string; specialization?: string; level: number; originalString: string } => {
    const [skillPart, levelStr] = skillString.split('-');
    const level = parseInt(levelStr) || 0;
    
    // Extract the true base skill name (everything before the first parenthesis)
    const baseSkillMatch = skillPart.match(/^([^(]+)/);
    const baseSkill = baseSkillMatch ? baseSkillMatch[1].trim() : skillPart.trim();
    
    // Check if skill has specialization in parentheses (get the last set of parentheses)
    const specializationMatch = skillPart.match(/\(([^)]+)\)\s*$/);
    if (specializationMatch) {
      const specialization = specializationMatch[1].trim();
      // Only return specialization if it's not a placeholder like "(any)" or "(comms or computers)"
      if (!specialization.includes('any') && !specialization.includes(' or ')) {
        return {
          baseSkill,
          specialization,
          level,
          originalString: skillString
        };
      }
    }
    
    return {
      baseSkill,
      level,
      originalString: skillString
    };
  };

  const combineSkills = (backgroundSkills: string[], careerSkills: string[]): Skill[] => {
    const skillEntries: SkillEntry[] = [];
    
    // Process background skills
    backgroundSkills.forEach(skillString => {
      const parsed = parseSkillString(skillString);
      skillEntries.push({
        baseSkill: parsed.baseSkill,
        specialization: parsed.specialization,
        level: parsed.level,
        source: 'background',
        displayName: parsed.specialization 
          ? `${parsed.baseSkill} (${capitalizeSpecialization(parsed.specialization)})`
          : parsed.baseSkill,
        originalString: parsed.originalString
      });
    });

    // Process career skills with intelligent merging
    careerSkills.forEach(skillString => {
      const parsed = parseSkillString(skillString);
      
      // Find existing skills with same base skill
      const existingSkills = skillEntries.filter(entry => entry.baseSkill === parsed.baseSkill);
      
      if (existingSkills.length === 0) {
        // No existing skill, add directly
        skillEntries.push({
          baseSkill: parsed.baseSkill,
          specialization: parsed.specialization,
          level: parsed.level,
          source: 'career',
          displayName: parsed.specialization 
            ? `${parsed.baseSkill} (${capitalizeSpecialization(parsed.specialization)})`
            : parsed.baseSkill,
          originalString: parsed.originalString
        });
      } else {
        // Handle skill merging based on specializations
        // Don't merge skills with "(any)" specialization - they need separate choices
        const exactMatch = existingSkills.find(entry => 
          entry.specialization === parsed.specialization &&
          !entry.originalString?.includes('(any)') && // Don't merge "(any)" skills
          !parsed.originalString?.includes('(any)')   // Don't merge "(any)" skills
        );
        
        if (exactMatch) {
          // Same specialization, use the higher level (level-up scenario)
          exactMatch.level = Math.max(exactMatch.level, parsed.level);
          exactMatch.source = 'package'; // Mark as combined
        } else {
          // Different or new specialization
          if (parsed.specialization) {
            // Career skill has specific specialization, add as separate skill
            skillEntries.push({
              baseSkill: parsed.baseSkill,
              specialization: parsed.specialization,
              level: parsed.level,
              source: 'career',
              displayName: `${parsed.baseSkill} (${capitalizeSpecialization(parsed.specialization)})`,
              originalString: parsed.originalString
            });
          } else {
            // Career skill has no specialization, upgrade existing or add general
            // But don't merge if either skill has "(any)" in original string
            const generalSkill = existingSkills.find(entry => 
              !entry.specialization && 
              !entry.originalString?.includes('(any)') && 
              !parsed.originalString?.includes('(any)')
            );
            if (generalSkill) {
              generalSkill.level = Math.min(4, generalSkill.level + parsed.level);
              generalSkill.source = 'package';
            } else {
              // Add as new general skill with its original level
              skillEntries.push({
                baseSkill: parsed.baseSkill,
                level: parsed.level,
                source: 'career',
                displayName: parsed.baseSkill,
                originalString: parsed.originalString
              });
            }
          }
        }
      }
    });

    // Remove generic skills when specialized versions exist at level 1 or higher
    const filteredEntries = skillEntries.filter(entry => {
      // If this is a generic skill (no specialization)
      if (!entry.specialization) {
        // Check if there are any specialized versions of this skill at level 1 or higher
        const hasSpecializedVersion = skillEntries.some(otherEntry => 
          otherEntry.baseSkill === entry.baseSkill && 
          otherEntry.specialization && 
          otherEntry.level >= 1 &&
          otherEntry !== entry
        );
        
        // Remove generic skill if specialized version exists
        return !hasSpecializedVersion;
      }
      
      // Keep all specialized skills
      return true;
    });

    // Convert to Skill array format
    return filteredEntries.map(entry => ({
      name: entry.displayName,
      level: entry.level,
      source: entry.source
    }));
  };

  // Unfiltered version of combineSkills for choice detection
  const combineSkillsUnfiltered = (backgroundSkills: string[], careerSkills: string[]): Skill[] => {
    const skillEntries: SkillEntry[] = [];
    
    // Process background skills
    backgroundSkills.forEach(skillString => {
      const parsed = parseSkillString(skillString);
      skillEntries.push({
        baseSkill: parsed.baseSkill,
        specialization: parsed.specialization,
        level: parsed.level,
        source: 'background',
        displayName: parsed.specialization 
          ? `${parsed.baseSkill} (${capitalizeSpecialization(parsed.specialization)})`
          : parsed.baseSkill,
        originalString: parsed.originalString
      });
    });

    // Process career skills with intelligent merging
    careerSkills.forEach(skillString => {
      const parsed = parseSkillString(skillString);
      
      // Find existing skills with same base skill
      const existingSkills = skillEntries.filter(entry => entry.baseSkill === parsed.baseSkill);
      
      if (existingSkills.length === 0) {
        // No existing skill, add directly
        skillEntries.push({
          baseSkill: parsed.baseSkill,
          specialization: parsed.specialization,
          level: parsed.level,
          source: 'career',
          displayName: parsed.specialization 
            ? `${parsed.baseSkill} (${capitalizeSpecialization(parsed.specialization)})`
            : parsed.baseSkill,
          originalString: parsed.originalString
        });
      } else {
        // Handle skill merging based on specializations
        // Don't merge skills with "(any)" specialization - they need separate choices
        const exactMatch = existingSkills.find(entry => 
          entry.specialization === parsed.specialization &&
          !entry.originalString?.includes('(any)') && // Don't merge "(any)" skills
          !parsed.originalString?.includes('(any)')   // Don't merge "(any)" skills
        );
        
        if (exactMatch) {
          // Same specialization, use the higher level (level-up scenario)
          exactMatch.level = Math.max(exactMatch.level, parsed.level);
          exactMatch.source = 'package'; // Mark as combined
        } else {
          // Different or new specialization
          if (parsed.specialization) {
            // Career skill has specific specialization, add as separate skill
            skillEntries.push({
              baseSkill: parsed.baseSkill,
              specialization: parsed.specialization,
              level: parsed.level,
              source: 'career',
              displayName: `${parsed.baseSkill} (${capitalizeSpecialization(parsed.specialization)})`,
              originalString: parsed.originalString
            });
          } else {
            // Career skill has no specialization, upgrade existing or add general
            // But don't merge if either skill has "(any)" in original string
            const generalSkill = existingSkills.find(entry => 
              !entry.specialization && 
              !entry.originalString?.includes('(any)') && 
              !parsed.originalString?.includes('(any)')
            );
            if (generalSkill) {
              generalSkill.level = Math.min(4, generalSkill.level + parsed.level);
              generalSkill.source = 'package';
            } else {
              // Add as new general skill with its original level
              skillEntries.push({
                baseSkill: parsed.baseSkill,
                level: parsed.level,
                source: 'career',
                displayName: parsed.baseSkill,
                originalString: parsed.originalString
              });
            }
          }
        }
      }
    });

    // Convert to Skill array format (no filtering applied)
    return skillEntries.map(entry => ({
      name: entry.displayName,
      level: entry.level,
      source: entry.source
    }));
  };

  // Utility function to capitalize specialization names consistently
  const capitalizeSpecialization = (specialization: string): string => {
    return specialization
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Enhanced skill combination with specialization choice detection
  const combineSkillsWithChoices = (backgroundSkills: string[], careerSkills: string[]): {
    skills: Skill[];
    choices: { 
      skillName: string; 
      currentLevel: number; 
      gainedLevel: number; 
      choices: string[]; 
      skillInstance: string;
      choicesWithStatus: { specialization: string; status: 'new' | 'levelup' | 'blocked'; reason: string; existingLevel: number }[];
    }[];
  } => {
    // Use the filtered skills for display, but process choices on unfiltered skills
    const skills = combineSkills(backgroundSkills, careerSkills);
    
    // Create unfiltered skills for choice detection
    const unfilteredSkills = combineSkillsUnfiltered(backgroundSkills, careerSkills);
    const choices: { 
      skillName: string; 
      currentLevel: number; 
      gainedLevel: number; 
      choices: string[]; 
      skillInstance: string;
      choicesWithStatus: { specialization: string; status: 'new' | 'levelup' | 'blocked'; reason: string; existingLevel: number }[];
    }[] = [];

    // Official Traveller skill specializations
    const skillSpecializations: { [key: string]: string[] } = {
      'Animals': ['handling', 'veterinary', 'training'],
      'Art': ['performer', 'holography', 'instrument', 'visual media', 'write'],
      'Athletics': ['dexterity', 'endurance', 'strength'],
      'Drive': ['hovercraft', 'mole', 'tracked', 'walker', 'wheeled'],
      'Electronics': ['comms', 'computers', 'remote ops', 'sensors'],
      'Engineer': ['m-drive', 'j-drive', 'life support', 'power'],
      'Flyer': ['airship', 'grav', 'ornithopter', 'rotor', 'wing'],
      'Gun Combat': ['archaic', 'energy', 'slug'],
      'Gunner': ['turret', 'ortillery', 'screen', 'capital'],
      'Heavy Weapons': ['artillery', 'portable', 'vehicle'],
      'Language': ['galanglic', 'vilani', 'zdetl', 'oynprith', 'trokh', 'gvegh', 'other'],
      'Melee': ['unarmed', 'blade', 'bludgeon', 'natural'],
      'Pilot': ['small craft', 'spacecraft', 'capital ships'],
      'Profession': ['belter', 'biologicals', 'civil engineering', 'construction', 'hydroponics', 'polymers', 'other'],
      'Science': ['archaeology', 'astronomy', 'biology', 'chemistry', 'cosmology', 'cybernetics', 'economics', 'genetics', 'history', 'linguistics', 'philosophy', 'physics', 'planetology', 'psionicology', 'psychology', 'robotics', 'sophontology', 'xenology'],
      'Seafarer': ['ocean ships', 'personal', 'sail', 'submarine'],
      'Tactics': ['military', 'naval']
    };

    // Check for skills that need specialization choices (use unfiltered skills)
    unfilteredSkills.forEach(skill => {
      const baseSkill = skill.name.split(' (')[0];
      console.log('Processing skill for choices:', skill);
      
      // Check if skill needs specialization choice
      const needsChoice = skillSpecializations[baseSkill] && 
        skill.level >= 1 && 
        (
          !skill.name.includes('(') || // No specialization at all
          skill.name.includes('(any)') || // Has "(any)" placeholder
          skill.name.includes(' or ') || // Has multiple options like "(comms or computers)"
          skill.name.includes('(comms or computers)') || // Specific case from packages
          skill.name.includes('(any survival)') || // Specific case: "Profession (any survival)"
          skill.name.includes('(local dialect)') // Specific case: "Language (local dialect)"
        );
      
      console.log('Skill needs choice:', skill.name, 'needsChoice:', needsChoice);
      
      if (needsChoice) {
        let availableChoices = skillSpecializations[baseSkill];
        
        // Handle special cases
        if (skill.name.includes(' or ')) {
          // Extract options from "(x or y)" pattern
          const match = skill.name.match(/\(([^)]+)\)/);
          if (match) {
            const options = match[1].split(' or ').map(opt => opt.trim());
            availableChoices = options;
          }
        } else if (skill.name.includes('(any survival)')) {
          // For profession (any survival), provide survival-related professions
          availableChoices = ['belter', 'construction', 'other'];
        } else if (skill.name.includes('(local dialect)')) {
          // For language (local dialect), provide common languages
          availableChoices = ['galanglic', 'vilani', 'zdetl', 'oynprith', 'trokh', 'gvegh', 'other'];
        } else if (skill.name.includes('(any)')) {
          // Handle different "(any)" cases
          if (baseSkill === 'Profession') {
            availableChoices = ['belter', 'biologicals', 'civil engineering', 'construction', 'hydroponics', 'polymers', 'other'];
          } else if (baseSkill === 'Animals') {
            availableChoices = ['handling', 'veterinary', 'training'];
          } else if (baseSkill === 'Athletics') {
            availableChoices = ['dexterity', 'endurance', 'strength'];
          } else if (baseSkill === 'Melee') {
            availableChoices = ['unarmed', 'blade', 'bludgeon', 'natural'];
          } else if (baseSkill === 'Gun Combat') {
            availableChoices = ['archaic', 'energy', 'slug'];
          } else if (baseSkill === 'Electronics') {
            availableChoices = ['comms', 'computers', 'remote ops', 'sensors'];
          } else if (baseSkill === 'Engineer') {
            availableChoices = ['m-drive', 'j-drive', 'life support', 'power'];
          } else if (baseSkill === 'Flyer') {
            availableChoices = ['airship', 'grav', 'ornithopter', 'rotor', 'wing'];
          } else if (baseSkill === 'Drive') {
            availableChoices = ['hovercraft', 'mole', 'tracked', 'walker', 'wheeled'];
          } else if (baseSkill === 'Seafarer') {
            availableChoices = ['ocean ships', 'personal', 'sail', 'submarine'];
          } else if (baseSkill === 'Science') {
            availableChoices = ['archaeology', 'astronomy', 'biology', 'chemistry', 'cosmology', 'cybernetics', 'economics', 'genetics', 'history', 'linguistics', 'philosophy', 'physics', 'planetology', 'psionicology', 'psychology', 'robotics', 'sophontology', 'xenology'];
          } else if (baseSkill === 'Art') {
            availableChoices = ['performer', 'holography', 'instrument', 'visual media', 'write'];
          }
        }
        
        // Create choice with information about existing skills for each specialization
        const choiceWithStatus: { specialization: string; status: 'new' | 'levelup' | 'blocked'; reason: string; existingLevel: number }[] = availableChoices.map(specialization => {
          // Check if character already has this specialization
          // We need to check both the processed skills and the original package skills
          const existingSkill = unfilteredSkills.find(existingSkill => {
            const existingBaseSkill = existingSkill.name.split(' (')[0];
            const existingSpecialization = existingSkill.name.includes('(') 
              ? existingSkill.name.match(/\(([^)]+)\)/)?.[1] 
              : null;
            
            // Normalize both specializations for comparison (lowercase)
            const normalizedExisting = existingSpecialization?.toLowerCase();
            const normalizedCurrent = specialization.toLowerCase();
            
            return existingBaseSkill === baseSkill && 
                   normalizedExisting === normalizedCurrent;
          });
          
          console.log(`Checking specialization ${specialization} for skill ${baseSkill}:`, {
            existingSkill,
            skillLevel: skill.level,
            allSkills: unfilteredSkills.map(s => ({ name: s.name, level: s.level }))
          });
          
          if (existingSkill) {
            if (existingSkill.level >= skill.level) {
              return { specialization, status: 'blocked' as const, reason: `Already have at level ${existingSkill.level}`, existingLevel: existingSkill.level };
            } else {
              return { specialization, status: 'levelup' as const, reason: `Will level up from ${existingSkill.level} to ${skill.level}`, existingLevel: existingSkill.level };
            }
          } else {
            return { specialization, status: 'new' as const, reason: 'New specialization', existingLevel: 0 };
          }
        });
        
        // Filter to only show available choices (new and levelup)
        const availableChoicesWithStatus = choiceWithStatus.filter(choice => choice.status !== 'blocked');
        
        // Only create choice if there are valid specializations available
        if (availableChoicesWithStatus.length > 0) {
          choices.push({
            skillName: baseSkill,
            currentLevel: skill.level,
            gainedLevel: skill.level,
            choices: availableChoicesWithStatus.map(c => c.specialization),
            choicesWithStatus: choiceWithStatus, // Include all choices with status for display
            skillInstance: `${baseSkill}-${skill.level}-${skill.source}` // Unique identifier for this specific skill instance
          });
        }
      }
    });

    return { skills, choices };
  };

  // Skill choice modal component
  const SkillChoiceModal: React.FC = () => {
    const allChoices = [...skillChoices, ...skillImprovementChoices];
    const pendingChoices = allChoices.filter(choice => !choice.resolved);
    if (pendingChoices.length === 0) return null;

    const currentChoice = pendingChoices[0];

    const handleSpecializationChoice = (specialization: string) => {
      // Apply the chosen specialization by updating the appropriate package skills
      const displaySpecialization = capitalizeSpecialization(specialization);
      
      // Check if this is a skill improvement choice
      const isSkillImprovement = currentChoice.skillInstance.includes('-improvement');

      // Update background package if it has the skill
      if (selectedBackgroundPackage) {
        const updatedBackgroundPackage = { ...selectedBackgroundPackage };
        
        updatedBackgroundPackage.skills = updatedBackgroundPackage.skills.map(skillString => {
          const [skillPart, levelStr] = skillString.split('-');
          const skillName = skillPart.trim();
          const baseSkillName = skillName.split(' (')[0]; // Extract base skill name
          const skillInstance = `${baseSkillName}-${levelStr}-background`;
          
          // Check if this is the specific skill instance that needs specialization
          const isTargetSkill = skillInstance === currentChoice.skillInstance && (
            !skillString.includes('(') || // No specialization
            skillString.includes('(any)') || // Has "(any)" placeholder
            skillString.includes(' or ') || // Has multiple options
            skillString.includes('(any survival)') || // Specific case
            skillString.includes('(local dialect)') // Specific case
          );
          
          if (isTargetSkill) {
            return `${baseSkillName} (${displaySpecialization})-${levelStr}`;
          }
          return skillString;
        });
        
        setSelectedBackgroundPackage(updatedBackgroundPackage);
      }

      // Update career package if it has the skill
      if (selectedCareerPackage) {
        const updatedCareerPackage = { ...selectedCareerPackage };
        
        updatedCareerPackage.skills = updatedCareerPackage.skills.map(skillString => {
          const [skillPart, levelStr] = skillString.split('-');
          const skillName = skillPart.trim();
          const baseSkillName = skillName.split(' (')[0]; // Extract base skill name
          const skillInstance = `${baseSkillName}-${levelStr}-career`;
          
          // Check if this is the specific skill instance that needs specialization
          const isTargetSkill = skillInstance === currentChoice.skillInstance && (
            !skillString.includes('(') || // No specialization
            skillString.includes('(any)') || // Has "(any)" placeholder
            skillString.includes(' or ') || // Has multiple options
            skillString.includes('(any survival)') || // Specific case
            skillString.includes('(local dialect)') // Specific case
          );
          
          if (isTargetSkill) {
            return `${baseSkillName} (${displaySpecialization})-${levelStr}`;
          }
          return skillString;
        });
        
        setSelectedCareerPackage(updatedCareerPackage);
      }

      // Handle level-up scenario: if user chooses specialization they already have at lower level,
      // remove the lower-level skill to prevent duplicates
      const isLevelUp = currentChoice.choicesWithStatus.some(choice => 
        choice.specialization === specialization && choice.status === 'levelup'
      );
      
      if (isLevelUp) {
        const levelUpChoice = currentChoice.choicesWithStatus.find(choice => 
          choice.specialization === specialization && choice.status === 'levelup'
        );
        
        if (levelUpChoice && levelUpChoice.existingLevel > 0) {
          // Find and remove the lower-level skill from the appropriate package
          const lowerLevelSkill = `${currentChoice.skillName} (${displaySpecialization})-${levelUpChoice.existingLevel}`;
          
          // Remove from background package if it exists there
          if (selectedBackgroundPackage) {
            const updatedBackgroundPackage = { ...selectedBackgroundPackage };
            updatedBackgroundPackage.skills = updatedBackgroundPackage.skills.filter(skill => 
              skill !== lowerLevelSkill
            );
            setSelectedBackgroundPackage(updatedBackgroundPackage);
          }
          
          // Remove from career package if it exists there
          if (selectedCareerPackage) {
            const updatedCareerPackage = { ...selectedCareerPackage };
            updatedCareerPackage.skills = updatedCareerPackage.skills.filter(skill => 
              skill !== lowerLevelSkill
            );
            setSelectedCareerPackage(updatedCareerPackage);
          }
        }
      }

      // Update the skill choice as resolved
      if (isSkillImprovement) {
        setSkillImprovementChoices(prev => prev.map(choice => 
          choice === currentChoice 
            ? { ...choice, resolved: true }
            : choice
        ));
      } else {
        setSkillChoices(prev => prev.map(choice => 
          choice === currentChoice 
            ? { ...choice, resolved: true }
            : choice
        ));
      }

      // Update remaining choices to reflect that this specialization is now chosen
      if (!isSkillImprovement) {
        setSkillChoices(prev => prev.map(choice => {
        if (choice.skillName === currentChoice.skillName && 
            choice.skillInstance !== currentChoice.skillInstance && 
            !choice.resolved) {
          // Update the choicesWithStatus to mark this specialization as blocked
          const updatedChoicesWithStatus = choice.choicesWithStatus.map(c => 
            c.specialization === specialization 
              ? { ...c, status: 'blocked' as const, reason: 'Already chosen for another skill in this career' }
              : c
          );
          
          // Filter out blocked choices from available choices
          const availableChoices = updatedChoicesWithStatus
            .filter(c => c.status !== 'blocked')
            .map(c => c.specialization);
          
          return {
            ...choice,
            choices: availableChoices,
            choicesWithStatus: updatedChoicesWithStatus
          };
        }
        return choice;
        }));
      }

      // If this was the last choice, close the modal
      if (pendingChoices.length === 1) {
        setShowSkillChoiceModal(false);
        
        // If this was a skill improvement choice, apply the improvements
        if (isSkillImprovement) {
          const newImprovements = resetImprovementsRef.current ? {} : { ...skillImprovements };
          const skillName = `${currentChoice.skillName} (${displaySpecialization})`;
          // Determine delta to reach level 1 if below 1; otherwise block path should've prevented this
          const combined = combineSkills(selectedBackgroundPackage?.skills || [], selectedCareerPackage?.skills || []);
          // For specialization improvements, only consider the exact specialization level,
          // not the highest level of another specialization of the same base skill.
          const existing = combined.find(s => s.name === skillName);
          const currentLevel = existing ? existing.level : 0;
          const delta = Math.max(0, 1 - currentLevel);
          if (delta > 0) {
            newImprovements[skillName] = (newImprovements[skillName] || 0) + delta;
          }
          setSkillImprovements(newImprovements);
          resetImprovementsRef.current = false;
          
          // Create skill improvement event
          const improvementEvent = CharacterHistoryManager.createGainEvent(
            'skill',
            skillName,
            1,
            `Enhanced professional abilities through additional training and experience: ${skillName}`,
            {
              narrative: `Final training and experience refinement before beginning their adventuring career.`
            },
            {
              source: 'character_finalization',
              method: 'training' as const,
              significance: 'minor' as const
            }
          );
          
          setEvents(prev => [...prev, improvementEvent]);
          setFinalizingStep('benefits');
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold text-white mb-4">Choose Skill Specialization</h3>
          
          <div className="mb-4">
            <p className="text-slate-300 text-sm mb-2">
              You have gained <strong>{currentChoice.skillName}</strong> at level {currentChoice.gainedLevel}.
              {currentChoice.skillInstance.includes('-background') && <span className="text-slate-400 text-xs block">(Background Package)</span>}
              {currentChoice.skillInstance.includes('-career') && <span className="text-slate-400 text-xs block">(Career Package)</span>}
            </p>
            <p className="text-slate-400 text-xs mb-4">
              {currentChoice.skillName === 'Electronics' && currentChoice.choices.length === 2 
                ? "Choose between the available Electronics specializations:"
                : currentChoice.skillName === 'Profession' && currentChoice.choices.includes('any')
                ? "Choose your specific profession specialization:"
                : currentChoice.skillName === 'Language' && currentChoice.choices.includes('galanglic')
                ? "Choose your specific language specialization:"
                : "Since this skill is level 1 or higher, you must choose a specialization:"
              }
            </p>
          </div>

          <div className="space-y-2 mb-6 max-h-80 overflow-y-auto pr-2 skill-choice-scroll">
            {currentChoice.choicesWithStatus.map((choiceInfo, index) => {
              // Capitalize specialization for display
              const displaySpecialization = capitalizeSpecialization(choiceInfo.specialization);
              
              const isBlocked = choiceInfo.status === 'blocked';
              const isLevelUp = choiceInfo.status === 'levelup';
              
              return (
                <div
                  key={index}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                    isBlocked 
                      ? 'bg-red-900/10 border-red-500/30 text-red-300 cursor-not-allowed'
                      : isLevelUp
                      ? 'bg-green-900/20 border-green-500/50 text-green-200 hover:bg-green-900/30 hover:border-green-400/70 cursor-pointer shadow-lg shadow-green-500/10'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500 cursor-pointer'
                  }`}
                >
                  {isBlocked ? (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg">
                            {currentChoice.skillName} ({displaySpecialization})
                          </span>
                          <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-semibold">
                            BLOCKED
                          </span>
                        </div>
                        <div className="text-red-400 text-sm font-medium mb-1">
                          {choiceInfo.reason}
                        </div>
                        <div className="text-red-500/70 text-xs">
                          You already have this specialization at level {choiceInfo.existingLevel} or higher
                        </div>
                      </div>
                      <div className="text-red-500 text-2xl ml-3">🚫</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSpecializationChoice(choiceInfo.specialization)}
                      className="w-full text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg">
                              {currentChoice.skillName} ({displaySpecialization})
                            </span>
                            {isLevelUp ? (
                              <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-semibold">
                                LEVEL UP
                              </span>
                            ) : (
                              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-semibold">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className={`text-sm font-medium mb-1 ${
                            isLevelUp ? 'text-green-300' : 'text-slate-400'
                          }`}>
                            {isLevelUp 
                              ? `Will upgrade from level ${choiceInfo.existingLevel} to level ${currentChoice.gainedLevel}`
                              : `New specialization at level ${currentChoice.gainedLevel}`
                            }
                          </div>
                          {isLevelUp ? (
                            <div className="text-green-400/80 text-xs">
                              ⬆️ This will replace your existing {currentChoice.skillName} ({displaySpecialization})-{choiceInfo.existingLevel}
                            </div>
                          ) : (
                            <div className="text-slate-500 text-xs">
                              → Add this as a new specialization
                            </div>
                          )}
                        </div>
                        <div className={`text-2xl ml-3 transition-colors ${
                          isLevelUp ? 'text-green-400' : 'text-slate-500'
                        }`}>
                          {isLevelUp ? '⬆️' : '→'}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-500">
            Remaining choices: {pendingChoices.length}
          </div>
        </div>
      </div>
    );
  };

  const finalizeCharacter = (): void => {
    if (!selectedBackgroundPackage || !selectedCareerPackage || !characterAge) return;

    // Combine skills from background and career packages
    const combinedSkills = combineSkills(selectedBackgroundPackage.skills, selectedCareerPackage.skills);

    // Calculate terms based on age (approximate: (age - 18) / 4, minimum 1)
    const estimatedTerms = Math.max(1, Math.floor((characterAge - 18) / 4));

    // Create final character
    const finalCharacter: Character = {
      ...character,
      characteristics,
      species: selectedSpecies,
      age: characterAge,
      terms: estimatedTerms,
      credits: getTotalCredits(),
      skills: combinedSkills,
      equipment: [...selectedBackgroundPackage.equipment, ...selectedCareerPackage.equipment],
      benefits: [...selectedBackgroundPackage.benefits, ...selectedCareerPackage.benefits],
      history: events,
      backstory: {
        events,
        summary: `${selectedBackgroundPackage.narrative.background} ${selectedCareerPackage.narrative.background}`,
        keyMoments: [`Chose ${selectedBackgroundPackage.name} background`, `Chose ${selectedCareerPackage.name} career`],
        relationships: [],
        motivations: selectedCareerPackage.narrative.motivations
      }
    };

    // Create completion milestone
    const completionEvent = CharacterHistoryManager.createMilestoneEvent(
      `Completed package-based creation: ${selectedBackgroundPackage.name} + ${selectedCareerPackage.name}`,
      `Character creation completed using ${selectedBackgroundPackage.name} background and ${selectedCareerPackage.name} career packages. Ready for adventure!`,
      {
        narrative: `With their background established and career skills acquired, they are ready to face whatever challenges await in the galaxy.`
      },
      {
        significance: 'life_defining' as const,
        themes: ['character_creation', 'package_based', selectedBackgroundPackage.id, selectedCareerPackage.id]
      }
    );

    const finalEvents = [...events, completionEvent];
    const completeCharacter = { ...finalCharacter, history: finalEvents };

    onCharacterUpdate(completeCharacter);
    onComplete(completeCharacter);
  };

  // Point redistribution system: start all at 7; move points between stats (min 2, max 12)
  const [pointPool, setPointPool] = useState<number>(0);
  const minStat = 2;
  const maxStat = 12;

  const incrementStat = (key: keyof typeof characteristics) => {
    if (pointPool <= 0) return;
    if (characteristics[key] >= maxStat) return;
    setCharacteristics({ ...characteristics, [key]: characteristics[key] + 1 });
    setPointPool(pointPool - 1);
  };

  const decrementStat = (key: keyof typeof characteristics) => {
    if (characteristics[key] <= minStat) return;
    setCharacteristics({ ...characteristics, [key]: characteristics[key] - 1 });
    setPointPool(pointPool + 1);
  };

  const renderCharacteristicsStep = (): React.ReactElement => (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Step 1: Set Characteristics</h2>
      <p className="text-slate-400 mb-6">
        All characteristics start at 7. You can move points from one stat to another. Minimum {minStat}, maximum {maxStat}.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(characteristics).map(([char, value]) => (
          <div key={char} className="p-4 bg-slate-800 rounded-lg text-center">
            <div className="text-slate-400 text-sm font-medium">{char}</div>
            <div className="flex items-center justify-center gap-3 mt-2">
              <button
                onClick={() => decrementStat(char as keyof typeof characteristics)}
                className="px-2 py-1 rounded bg-slate-700 text-white disabled:opacity-40"
                disabled={value <= minStat}
              >
                −
              </button>
              <div className="text-2xl font-bold text-white w-10 text-center">{value}</div>
              <button
                onClick={() => incrementStat(char as keyof typeof characteristics)}
                className="px-2 py-1 rounded bg-slate-700 text-white disabled:opacity-40"
                disabled={pointPool <= 0 || value >= maxStat}
              >
                +
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-2">min {minStat} • max {maxStat}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-slate-300 text-sm">Points available to add: <span className="font-semibold text-white">{pointPool}</span></div>
        <button
          onClick={() => setCurrentStep('background')}
          className="btn-primary"
        >
          Continue to Background Package →
        </button>
      </div>
    </div>
  );



  const renderBackgroundStep = (): React.ReactElement => (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Step 2: Choose Background Package</h2>
      <p className="text-slate-400 mb-6">
        Select a background package that represents your character's upbringing and early life.
        Background packages provide characteristic modifiers and foundational skills.
      </p>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {backgroundPackages.map(pkg => (
          <button
            key={pkg.id}
            onClick={() => handleBackgroundPackageSelect(pkg)}
            className={`p-6 rounded-lg border text-left transition-colors h-full ${
              selectedBackgroundPackage?.id === pkg.id
                ? 'bg-green-500/20 border-green-400 text-green-200'
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {/* Header */}
            <div className="mb-4">
              <div className="font-bold text-white text-xl mb-2">{pkg.name}</div>
              <div className="text-sm text-slate-400 leading-relaxed">{pkg.description}</div>
            </div>

            {/* Characteristic Modifiers */}
            <div className="mb-4">
              <div className="text-slate-500 text-xs font-medium mb-2">CHARACTERISTIC MODIFIERS:</div>
              <div className="flex flex-wrap gap-2">
                {pkg.characteristicModifiers.map((mod, index) => (
                  <span 
                    key={index}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      mod.modifier >= 0 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {mod.characteristic} {mod.modifier >= 0 ? '+' : ''}{mod.modifier}
                  </span>
                ))}
              </div>
            </div>

            {/* Credits */}
            <div className="mb-4">
              <div className="text-slate-500 text-xs font-medium mb-1">CREDITS:</div>
              <div className="text-white font-bold text-lg">{pkg.credits.toLocaleString()}</div>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <div className="text-slate-500 text-xs font-medium mb-2">SKILLS:</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {pkg.skills.map((skill, index) => (
                  <div key={index} className="text-slate-300 text-xs">• {skill}</div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-4">
              <div className="text-slate-500 text-xs font-medium mb-2">BENEFITS:</div>
              <div className="space-y-1">
                {pkg.benefits.map((benefit, index) => (
                  <div key={index} className="text-slate-300 text-xs">• {benefit}</div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="mb-4">
              <div className="text-slate-500 text-xs font-medium mb-2">EQUIPMENT:</div>
              <div className="space-y-1">
                {pkg.equipment.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-slate-300 text-xs">• {item}</div>
                ))}
                {pkg.equipment.length > 3 && (
                  <div className="text-slate-400 text-xs">+ {pkg.equipment.length - 3} more items</div>
                )}
              </div>
            </div>

            {/* Suitable For */}
            <div className="mt-auto pt-4 border-t border-slate-600">
              <div className="text-slate-500 text-xs font-medium mb-1">SUITABLE FOR:</div>
              <div className="text-slate-400 text-xs">{pkg.narrative.suitableFor.join(', ')}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('characteristics')}
          className="btn-secondary"
        >
          ← Back to Characteristics
        </button>
        <button
          onClick={() => setCurrentStep('career')}
          disabled={!selectedBackgroundPackage}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Career Package →
        </button>
      </div>
    </div>
  );

  const renderCareerStep = (): React.ReactElement => (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Step 3: Choose Career Package</h2>
      <p className="text-slate-400 mb-6">
        Select a career package that represents your character's professional life and experience.
        Career packages provide advanced skills, equipment, and professional background.
      </p>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {careerPackages.map(pkg => (
          <button
            key={pkg.id}
            onClick={() => handleCareerPackageSelect(pkg)}
            className={`p-6 rounded-lg border text-left transition-colors h-full ${
              selectedCareerPackage?.id === pkg.id
                ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {/* Header */}
            <div className="mb-4">
              <div className="font-bold text-white text-xl mb-2">{pkg.name}</div>
              <div className="text-sm text-slate-400 leading-relaxed">{pkg.description}</div>
            </div>



            {/* Credits */}
            <div className="mb-4">
              <div className="text-slate-500 text-xs font-medium mb-1">CREDITS:</div>
              <div className="text-white font-bold text-lg">{pkg.credits.toLocaleString()}</div>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <div className="text-slate-500 text-xs font-medium mb-2">SKILLS:</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {pkg.skills.map((skill, index) => (
                  <div key={index} className="text-slate-300 text-xs">• {skill}</div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-4">
              <div className="text-slate-500 text-xs font-medium mb-2">BENEFITS:</div>
              <div className="space-y-1">
                {pkg.benefits.map((benefit, index) => (
                  <div key={index} className="text-slate-300 text-xs">• {benefit}</div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="mb-4">
              <div className="text-slate-500 text-xs font-medium mb-2">EQUIPMENT:</div>
              <div className="space-y-1">
                {pkg.equipment.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-slate-300 text-xs">• {item}</div>
                ))}
                {pkg.equipment.length > 3 && (
                  <div className="text-slate-400 text-xs">+ {pkg.equipment.length - 3} more items</div>
                )}
              </div>
            </div>

            {/* Personality & Motivations */}
            <div className="mt-auto pt-4 border-t border-slate-600">
              <div className="text-slate-500 text-xs font-medium mb-1">PERSONALITY:</div>
              <div className="text-slate-400 text-xs mb-2">{pkg.narrative.personality.join(', ')}</div>
              <div className="text-slate-500 text-xs font-medium mb-1">MOTIVATIONS:</div>
              <div className="text-slate-400 text-xs">{pkg.narrative.motivations.join(', ')}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('background')}
          className="btn-secondary"
        >
          ← Back to Background
        </button>
        <button
          onClick={() => setCurrentStep('finalize')}
          disabled={!selectedCareerPackage}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Finalize →
        </button>
      </div>
    </div>
  );

  const availableSkillOptions = [
    'Vacc Suit and Steward', 'Gunner (any) and Mechanic', 'Pilot and Electronics (any)', 
    'Gun Combat (any) and Recon', 'Melee (any) and Streetwise', 'Broker and Admin',
    'Carouse and Deception', 'Engineer (any) and Electronics (any)', 'Science (any) and Investigate',
    'Drive (any) and Profession (any)', 'Survival and Navigation', 'Medic and Admin'
  ];

  const handleSkillImprovement = (optionIndex: number) => {
    // Clear previous skill improvements if changing selection
    if (selectedSkillImprovement !== null && selectedSkillImprovement !== optionIndex) {
      // Mark to reset synchronously for this selection flow
      resetImprovementsRef.current = true;
      setSkillImprovements({});
    }
    
    // Set the selected skill improvement option
    setSelectedSkillImprovement(optionIndex);
    
    const option = availableSkillOptions[optionIndex];
    const skills = option.split(' and ');
    
    // Check if any of the skills need specialization choices
    const currentSkills = combineSkills(selectedBackgroundPackage?.skills || [], selectedCareerPackage?.skills || []);
    const choices: typeof skillImprovementChoices = [];
    
    skills.forEach(skillName => {
      const trimmedSkill = skillName.trim();
      const baseSkill = trimmedSkill.split(' (')[0];
      
      // Find current skill level
      const existingSkill = currentSkills.find(s => s.name === trimmedSkill || s.name.split(' (')[0] === baseSkill);
      const currentLevel = existingSkill ? existingSkill.level : 0;
      const targetLevel = 1; // Improvement rule: set to level 1 if not already
      
      // Check if this skill has specializations and needs a choice
      const skillSpecializations: { [key: string]: string[] } = {
        'Animals': ['handling', 'veterinary', 'training'],
        'Art': ['performer', 'holography', 'instrument', 'visual media', 'write'],
        'Athletics': ['dexterity', 'endurance', 'strength'],
        'Drive': ['hovercraft', 'mole', 'tracked', 'walker', 'wheeled'],
        'Electronics': ['comms', 'computers', 'remote ops', 'sensors'],
        'Engineer': ['m-drive', 'j-drive', 'life support', 'power'],
        'Flyer': ['airship', 'grav', 'ornithopter', 'rotor', 'wing'],
        'Gun Combat': ['archaic', 'energy', 'slug'],
        'Gunner': ['turret', 'ortillery', 'screen', 'capital'],
        'Heavy Weapons': ['artillery', 'portable', 'vehicle'],
        'Language': ['galanglic', 'vilani', 'zdetl', 'oynprith', 'trokh', 'gvegh', 'other'],
        'Melee': ['unarmed', 'blade', 'bludgeon', 'natural'],
        'Pilot': ['small craft', 'spacecraft', 'capital ships'],
        'Profession': ['belter', 'biologicals', 'civil engineering', 'construction', 'hydroponics', 'polymers', 'other'],
        'Science': ['archaeology', 'astronomy', 'biology', 'chemistry', 'cosmology', 'cybernetics', 'economics', 'genetics', 'history', 'linguistics', 'philosophy', 'physics', 'planetology', 'psionicology', 'psychology', 'robotics', 'sophontology', 'xenology'],
        'Seafarer': ['ocean ships', 'personal', 'sail', 'submarine'],
        'Tactics': ['military', 'naval']
      };
      
      const needsChoice = skillSpecializations[baseSkill] && 
        targetLevel >= 1 && 
        (
          !trimmedSkill.includes('(') || // No specialization at all
          trimmedSkill.includes('(any)') // Has "(any)" placeholder
        );
      
      if (needsChoice) {
        const availableChoices = skillSpecializations[baseSkill];
        
        // Create choice with information about existing skills
        const choiceWithStatus = availableChoices.map(specialization => {
          const existingSkillWithSpec = currentSkills.find(existingSkill => {
            const existingBaseSkill = existingSkill.name.split(' (')[0];
            const existingSpecialization = existingSkill.name.includes('(') 
              ? existingSkill.name.match(/\(([^)]+)\)/)?.[1] 
              : null;
            
            const normalizedExisting = existingSpecialization?.toLowerCase();
            const normalizedCurrent = specialization.toLowerCase();
            
            return existingBaseSkill === baseSkill && 
                   normalizedExisting === normalizedCurrent;
          });
          
          if (existingSkillWithSpec) {
            // Since improvement sets to level 1, any existing level >=1 means this choice has no effect
            return { specialization, status: 'blocked' as const, reason: `Already have at level ${existingSkillWithSpec.level}`, existingLevel: existingSkillWithSpec.level };
          } else {
            // New specialization will be set to level 1
            return { specialization, status: 'new' as const, reason: 'Will set to level 1', existingLevel: 0 };
          }
        });
        
        // Filter to only show available choices (new and levelup)
        const availableChoicesWithStatus = choiceWithStatus.filter(choice => choice.status !== 'blocked');
        
        if (availableChoicesWithStatus.length > 0) {
          choices.push({
            skillName: baseSkill,
            currentLevel: currentLevel,
            gainedLevel: targetLevel,
            choices: availableChoicesWithStatus.map(c => c.specialization),
            choicesWithStatus: choiceWithStatus,
            skillInstance: `${baseSkill}-${targetLevel}-improvement`,
            resolved: false
          });
        }
      }
    });
    
    if (choices.length > 0) {
      // Store the improvement option and show specialization choices
      setSkillImprovementChoices(choices);
      setShowSkillChoiceModal(true);
    } else {
      // No specialization choices needed, apply improvements directly
      const newImprovements = resetImprovementsRef.current ? {} : { ...skillImprovements };
      skills.forEach(skill => {
        const trimmed = skill.trim();
        const base = trimmed.split(' (')[0];
        const existing = currentSkills.find(s => s.name === trimmed || s.name.split(' (')[0] === base);
        const currentLevel = existing ? existing.level : 0;
        const delta = Math.max(0, 1 - currentLevel); // set to 1 if below 1
        if (delta > 0) {
          newImprovements[trimmed] = (newImprovements[trimmed] || 0) + delta;
        }
      });
      setSkillImprovements(newImprovements);
      resetImprovementsRef.current = false;
      
      // Create skill improvement event
      const improvementEvent = CharacterHistoryManager.createGainEvent(
        'skill',
        option,
        1,
        `Enhanced professional abilities through additional training and experience: ${option}`,
        {
          narrative: `Final training and experience refinement before beginning their adventuring career.`
        },
        {
          source: 'character_finalization',
          method: 'training' as const,
          significance: 'minor' as const
        }
      );
      
      setEvents(prev => [...prev, improvementEvent]);
      setFinalizingStep('benefits');
    }
  };

  const renderFinalizeStep = (): React.ReactElement => {
    if (!selectedBackgroundPackage || !selectedCareerPackage) return <div>Packages not selected</div>;

    if (finalizingStep === 'review') {
      return (
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Step 4: Character Summary</h2>
          <p className="text-slate-400 mb-6">
            Review your character and roll for age before finalizing creation.
          </p>

          {/* Age Rolling Section */}
          <div className="mb-8 p-6 bg-slate-800 rounded-lg border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Character Age</h3>
            {!characterAge ? (
              <div className="text-center">
                <p className="text-slate-400 mb-4">
                  Roll 3d6 to determine your character's age (22 + roll = 25-40 years old)
                </p>
                <button
                  onClick={rollCharacterAge}
                  className="btn-primary"
                >
                  🎲 Roll for Age (3d6)
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-green-400 mb-2">Age determined:</p>
                <p className="text-white text-2xl font-bold">{characterAge} years old</p>
                <button
                  onClick={rollCharacterAge}
                  className="btn-secondary mt-2"
                >
                  🎲 Reroll Age
                </button>
              </div>
            )}
          </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Character Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Character Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Species:</span>
                <span className="text-white">{selectedSpecies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Background:</span>
                <span className="text-white">{selectedBackgroundPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Career:</span>
                <span className="text-white">{selectedCareerPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Age:</span>
                <span className="text-white">{characterAge || 'Not rolled yet'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rank:</span>
                <span className="text-white">{characterRank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Credits:</span>
                <span className="text-white">{getTotalCredits().toLocaleString()}</span>
              </div>
            </div>

            <h4 className="text-md font-semibold text-white mt-6 mb-3">Characteristics</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(getFinalCharacteristics()).map(([char, value]) => {
                const backgroundModifiers = getBackgroundModifiers();
                const backgroundMod = backgroundModifiers[char];
                const benefitBonus = characteristicBonuses[char];
                
                return (
                  <div key={char} className="text-center p-2 bg-slate-800 rounded">
                    <div className="text-xs text-slate-400">{char}</div>
                    <div className="text-lg font-bold text-white">
                      {value}
                      {(backgroundMod || benefitBonus) && (
                        <div className="text-xs mt-1">
                          {backgroundMod && (
                            <span className="text-blue-400">+{backgroundMod} (bg)</span>
                          )}
                          {backgroundMod && benefitBonus && <span className="text-slate-500 mx-1">+</span>}
                          {benefitBonus && (
                            <span className="text-green-400">+{benefitBonus} (benefit)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Package Details */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Combined Skills</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {combineSkills(selectedBackgroundPackage.skills, selectedCareerPackage.skills)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((skill, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-slate-700/50 rounded border border-slate-600">
                  <span className="text-slate-200 text-sm font-medium">{skill.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{skill.level}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(dot => (
                        <div
                          key={dot}
                          className={`w-2 h-2 rounded-full ${
                            dot <= skill.level 
                              ? skill.level >= 3 
                                ? 'bg-green-400' 
                                : skill.level >= 2 
                                  ? 'bg-yellow-400' 
                                  : 'bg-blue-400'
                              : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 ml-1">
                      {skill.source === 'package' ? '📦' : skill.source === 'background' ? '🏠' : '💼'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Skills Legend */}
            <div className="p-2 bg-slate-800/30 border border-slate-600/50 rounded text-xs text-slate-400 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span>Level 1</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span>Level 2</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span>Level 3+</span>
                </div>
                <span>🏠 Background • 💼 Career • 📦 Combined</span>
              </div>
            </div>

            <h4 className="text-md font-semibold text-white mb-2">Equipment</h4>
            <ul className="text-sm text-slate-300 mb-4 list-disc list-inside">
              {[...selectedBackgroundPackage.equipment, ...selectedCareerPackage.equipment].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h4 className="text-md font-semibold text-white mb-2">Benefits</h4>
            <div className="text-sm text-slate-300">
              {[...selectedBackgroundPackage.benefits, ...selectedCareerPackage.benefits].join(', ')}
            </div>
          </div>
        </div>

        {/* Combined Background Narrative */}
        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
          <h4 className="text-md font-semibold text-white mb-2">Combined Background</h4>
          <p className="text-sm text-slate-300 mb-3">
            <strong>Background:</strong> {selectedBackgroundPackage.narrative.background}
          </p>
          <p className="text-sm text-slate-300 mb-3">
            <strong>Career:</strong> {selectedCareerPackage.narrative.background}
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Personality:</span>
              <span className="text-slate-300 ml-2">{selectedCareerPackage.narrative.personality.join(', ')}</span>
            </div>
            <div>
              <span className="text-slate-400">Motivations:</span>
              <span className="text-slate-300 ml-2">{selectedCareerPackage.narrative.motivations.join(', ')}</span>
            </div>
          </div>
        </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep('career')}
              className="btn-secondary"
            >
              ← Back to Career Selection
            </button>
                      <button
            onClick={() => setFinalizingStep('career_option')}
            disabled={!characterAge}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Career Option →
          </button>
          </div>
        </div>
      );
    }

    if (finalizingStep === 'career_option') {
      return (
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Finalising the Traveller - Career Option</h2>
          <p className="text-slate-400 mb-6">
            Choose one career option to finalize your character's career path.
          </p>

          <div className="space-y-4 mb-8">
            {[
              "Increase any skill offered at level 1 or above in the Traveller's career package to level 4",
              "Increase any 3 skills listed in the Traveller's career package at any level by one each, to a maximum of 2",
              "Leave the service at Rank 4 without gaining extra skills"
            ].map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedCareerOption(index);
                  // Modify rank based on career option
                  if (index === 2) {
                    // Leave service at Rank 4
                    setCharacterRank('Rank 4');
                  } else {
                    // Keep the rank from the career package (already set when career was selected)
                    // No change needed - rank stays as set by the career package
                  }
                }}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  selectedCareerOption === index
                    ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <div className="font-semibold text-white mb-1">{index + 1}.</div>
                <div className="text-sm">{option}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setFinalizingStep('review')}
              className="btn-secondary"
            >
              ← Back to Review
            </button>
            <button
              onClick={() => setFinalizingStep('skill_improvement')}
              disabled={selectedCareerOption === null}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Skill Improvement →
            </button>
          </div>
        </div>
      );
    }

    if (finalizingStep === 'skill_improvement') {
      return (
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Finalising the Traveller</h2>
          {selectedCareerOption === 0 && (
            <p className="text-slate-400 mb-6">
              Option 1: Choose one skill from your career package that is offered at level 1 or above. That skill is raised to level 4.
            </p>
          )}
          {selectedCareerOption === 1 && (
            <p className="text-slate-400 mb-6">
              Option 2: Choose any 3 skills listed in your career package. Each chosen skill increases by +1, to a maximum of level 2.
            </p>
          )}
          {selectedCareerOption === 2 && (
            <p className="text-slate-400 mb-6">
              Choose one skill pair. For each skill: if you do not have it at level 1, you will gain it at level 1. If the skill uses specializations (e.g., Science), you will choose a specialization to gain at level 1. If the skill does not use specializations and you already have it at level 1 or higher, that part of the choice has no effect.
            </p>
          )}

          {improvementPhase === 'dual' && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {availableSkillOptions.map((option, index) => {
              const parts = option.split(' and ');
              const current = combineSkills(selectedBackgroundPackage?.skills || [], selectedCareerPackage?.skills || []);
              const specMap: { [key: string]: string[] } = {
                'Animals': ['handling','veterinary','training'],
                'Art': ['performer','holography','instrument','visual media','write'],
                'Athletics': ['dexterity','endurance','strength'],
                'Drive': ['hovercraft','mole','tracked','walker','wheeled'],
                'Electronics': ['comms','computers','remote ops','sensors'],
                'Engineer': ['m-drive','j-drive','life support','power'],
                'Flyer': ['airship','grav','ornithopter','rotor','wing'],
                'Gun Combat': ['archaic','energy','slug'],
                'Gunner': ['turret','ortillery','screen','capital'],
                'Heavy Weapons': ['artillery','portable','vehicle'],
                'Language': ['galanglic','vilani','zdetl','oynprith','trokh','gvegh','other'],
                'Melee': ['unarmed','blade','bludgeon','natural'],
                'Pilot': ['small craft','spacecraft','capital ships'],
                'Profession': ['belter','biologicals','civil engineering','construction','hydroponics','polymers','other'],
                'Science': ['archaeology','astronomy','biology','chemistry','cosmology','cybernetics','economics','genetics','history','linguistics','philosophy','physics','planetology','psionicology','psychology','robotics','sophontology','xenology'],
                'Seafarer': ['ocean ships','personal','sail','submarine'],
                'Tactics': ['military','naval']
              };
              const info = parts.map(label => {
                const trimmed = label.trim();
                const base = trimmed.split(' (')[0];
                const hasSpecs = !!specMap[base];
                const existing = current.find(s => s.name === trimmed || s.name.split(' (')[0] === base);
                const lvl = existing ? existing.level : 0;
                const useless = !hasSpecs && lvl >= 1;
                return { label: trimmed, base, level: lvl, useless, hasSpecs };
              });
              return (
                <button
                  key={index}
                  onClick={() => handleSkillImprovement(index)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedSkillImprovement === index
                      ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">{option}</div>
                  <div className="text-xs text-slate-400 mb-1">
                    For each skill: gain level 1 if below 1{` `}
                    {info.some(i => i.useless) && <span className="text-yellow-400">• This choice has a part with no effect</span>}
                  </div>
                  <div className="flex gap-3 text-xs">
                    {info.map((i, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800 border border-slate-600">
                        <span className="text-slate-300">{i.base}</span>
                        <span className="text-slate-400">(current {i.level})</span>
                        {i.useless && (
                          <span className="text-yellow-400 font-semibold">No effect</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {selectedSkillImprovement === index && (
                    <div className="text-xs text-blue-400 mt-2">
                      ✓ Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          )}

          {selectedCareerOption === 0 && improvementPhase === 'option' && (
            <div className="grid md:grid-cols-2 gap-3 mb-8">
              {combineSkills(selectedCareerPackage.skills, [])
                .filter(s => s.level >= 1)
                .map(s => {
                  const current = combineSkills(selectedBackgroundPackage?.skills || [], selectedCareerPackage?.skills || []);
                  const existing = current.find(cs => cs.name === s.name) || s;
                  const delta = Math.max(0, 4 - existing.level);
                  const selected = selectedOptionOneSkill === s.name;
                  return (
                    <button key={s.name}
                      onClick={() => {
                        setSelectedOptionOneSkill(s.name);
                        resetImprovementsRef.current = true;
                        const newImp: {[key:string]:number} = {};
                        if (delta > 0) newImp[s.name] = delta;
                        setSkillImprovements(newImp);
                        resetImprovementsRef.current = false;
                      }}
                      className={`p-3 rounded border text-left transition-colors ${selected ? 'bg-blue-500/20 border-blue-400 text-blue-200' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold text-white">{s.name}</span>
                        <span className="text-slate-400 text-xs">current {existing.level} → 4 {delta===0 && '(no change)'}</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {selectedCareerOption === 1 && improvementPhase === 'option' && (
            <div className="grid md:grid-cols-2 gap-3 mb-8">
              {combineSkills(selectedCareerPackage.skills, [])
                .map(s => {
                  const current = combineSkills(selectedBackgroundPackage?.skills || [], selectedCareerPackage?.skills || []);
                  const existing = current.find(cs => cs.name === s.name) || s;
                  const willInc = existing.level < 2 ? 1 : 0;
                  const selected = selectedOptionTwoSkills.includes(s.name);
                  return (
                    <button key={s.name}
                      onClick={() => {
                        const next = selected 
                          ? selectedOptionTwoSkills.filter(n => n !== s.name)
                          : selectedOptionTwoSkills.length < 3 
                            ? [...selectedOptionTwoSkills, s.name]
                            : selectedOptionTwoSkills;
                        setSelectedOptionTwoSkills(next);
                        // Recompute improvements
                        resetImprovementsRef.current = true;
                        const newImp: {[key:string]:number} = {};
                        next.forEach(name => {
                          const cur = current.find(cs => cs.name === name);
                          const inc = cur && cur.level < 2 ? 1 : 0;
                          if (inc > 0) newImp[name] = inc;
                        });
                        setSkillImprovements(newImp);
                        resetImprovementsRef.current = false;
                      }}
                      className={`p-3 rounded border text-left transition-colors ${selected ? 'bg-blue-500/20 border-blue-400 text-blue-200' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold text-white">{s.name}</span>
                        <span className="text-slate-400 text-xs">current {existing.level} {willInc===0 && '(max 2 reached)'}</span>
                      </div>
                      <div className="text-xs text-slate-400">{selected ? 'Selected' : selectedOptionTwoSkills.length>=3 ? 'Max 3 selections' : 'Click to select (up to 3)'}</div>
                    </button>
                  );
                })}
            </div>
          )}

          {selectedSkillImprovement !== null && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-blue-400 font-medium mb-1">Selected Skill Improvement</div>
                  <div className="text-white">{availableSkillOptions[selectedSkillImprovement]}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSkillImprovement(null);
                    setSkillImprovements({});
                  }}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-400/30 rounded hover:bg-red-500/30 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => {
                setFinalizingStep('career_option');
                setSelectedSkillImprovement(null);
                setSkillImprovements({});
              }}
              className="btn-secondary"
            >
              ← Back to Career Option
            </button>
            <button
              onClick={() => {
                if (improvementPhase === 'option') {
                  setImprovementPhase('dual');
                } else {
                  setFinalizingStep('benefits');
                }
              }}
              disabled={
                improvementPhase === 'option' ? (
                  selectedCareerOption === 0 ? selectedOptionOneSkill === null :
                  selectedCareerOption === 1 ? selectedOptionTwoSkills.length !== 3 :
                  false
                ) : selectedSkillImprovement === null
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {improvementPhase === 'option' ? 'Continue to Dual Skills →' : 'Continue to Benefits →'}
            </button>
          </div>
        </div>
      );
    }

    if (finalizingStep === 'benefits') {
      return (
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Finalising the Traveller - Benefits</h2>
          <p className="text-slate-400 mb-6">
            Choose one benefit to finalize your character.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              "1 Ship Share",
              "Cr100000 in cash",
              "Combat implant",
              "1 Ally and 2 Contacts",
              "TAS Membership",
              "SOC+1"
            ].map((benefit, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedBenefit(index);
                  // Apply SOC+1 bonus if this is the SOC+1 benefit (index 5)
                  if (index === 5) {
                    setCharacteristicBonuses(prev => ({
                      ...prev,
                      SOC: (prev.SOC || 0) + 1
                    }));
                  } else {
                    // Clear SOC bonus if selecting a different benefit
                    setCharacteristicBonuses(prev => {
                      const newBonuses = { ...prev };
                      if (newBonuses.SOC) {
                        delete newBonuses.SOC;
                      }
                      return newBonuses;
                    });
                  }
                }}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedBenefit === index
                    ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <div className="font-semibold text-white mb-1">{index + 1}.</div>
                <div className="text-sm">{benefit}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setFinalizingStep('skill_improvement')}
              className="btn-secondary"
            >
              ← Back to Skill Improvement
            </button>
            <button
              onClick={() => setFinalizingStep('complete')}
              disabled={selectedBenefit === null}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Character Creation ✨
            </button>
          </div>
        </div>
      );
    }

    // Complete step
    return (
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Character Creation Complete!</h2>
        <p className="text-slate-400 mb-6">
          Your character has been finalized with skill improvements applied.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Final Character Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Final Character Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Species:</span>
                <span className="text-white">{selectedSpecies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Background:</span>
                <span className="text-white">{selectedBackgroundPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Career:</span>
                <span className="text-white">{selectedCareerPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Age:</span>
                <span className="text-white">{characterAge || 'Not rolled yet'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rank:</span>
                <span className="text-white">{characterRank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Credits:</span>
                <span className="text-white">{getTotalCredits().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Career Option:</span>
                <span className="text-white">
                  {selectedCareerOption !== null ? selectedCareerOption + 1 : 'Not selected'}
                </span>
              </div>
            </div>

            <h4 className="text-md font-semibold text-white mt-6 mb-3">Final Characteristics</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(getFinalCharacteristics()).map(([char, value]) => {
                const backgroundModifiers = getBackgroundModifiers();
                const backgroundMod = backgroundModifiers[char];
                const benefitBonus = characteristicBonuses[char];
                
                return (
                  <div key={char} className="text-center p-2 bg-slate-800 rounded">
                    <div className="text-xs text-slate-400">{char}</div>
                    <div className="text-lg font-bold text-white">
                      {value}
                      {(backgroundMod || benefitBonus) && (
                        <div className="text-xs mt-1">
                          {backgroundMod && (
                            <span className="text-blue-400">+{backgroundMod} (bg)</span>
                          )}
                          {backgroundMod && benefitBonus && <span className="text-slate-500 mx-1">+</span>}
                          {benefitBonus && (
                            <span className="text-green-400">+{benefitBonus} (benefit)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Skills with Improvements */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Final Skills</h3>
            
            <div className="grid grid-cols-1 gap-2 mb-6">
              {(() => {
                // Start from combined skills
                const combined = combineSkills(selectedBackgroundPackage.skills, selectedCareerPackage.skills)
                  .map(skill => {
                    const improved = skillImprovements[skill.name] || 0;
                    const finalLevel = Math.min(4, skill.level + improved);
                    return { ...skill, finalLevel, improved };
                  });

                // Build a set of existing skill names for quick lookup
                const existingNames = new Set(combined.map(s => s.name));

                // Add any improvement-only skills not present in the combined list (e.g., Survival)
                Object.entries(skillImprovements).forEach(([improvedName, inc]) => {
                  if (!existingNames.has(improvedName)) {
                    // Create a synthetic entry with base level 0, improved by inc
                    const finalLevel = Math.min(4, 0 + (inc || 0));
                    combined.push({
                      name: improvedName,
                      level: 0,
                      source: 'package',
                      finalLevel,
                      improved: inc || 0,
                    } as any);
                  }
                });

                return combined.sort((a, b) => a.name.localeCompare(b.name));
              })()
                .map((skill, index) => (
                <div key={index} className={`flex justify-between items-center p-3 rounded border transition-colors ${
                  skill.improved > 0 
                    ? 'bg-green-500/10 border-green-400/30' 
                    : 'bg-slate-700/50 border-slate-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-medium">{skill.name}</span>
                    {skill.improved > 0 && (
                      <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-500/20 rounded">
                        +{skill.improved}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg">{skill.finalLevel}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(dot => (
                        <div
                          key={dot}
                          className={`w-3 h-3 rounded-full ${
                            dot <= skill.finalLevel 
                              ? skill.finalLevel >= 3 
                                ? 'bg-green-400' 
                                : skill.finalLevel >= 2 
                                  ? 'bg-yellow-400' 
                                  : 'bg-blue-400'
                              : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-xs text-slate-400">
                        {skill.source === 'package' ? '📦' : skill.source === 'background' ? '🏠' : '💼'}
                      </span>
                      {skill.improved > 0 && <span className="text-xs text-green-400">✨</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Skills Legend */}
            <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-white mb-2">Skills Legend</h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span>Level 1</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span>Level 2-3</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span>Level 3+</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏠 Background</span>
                  <span>💼 Career</span>
                  <span>📦 Combined</span>
                </div>
              </div>
            </div>

            {Object.keys(skillImprovements).length > 0 && (
              <div className="p-3 bg-green-500/10 border border-green-400/30 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <span>✨</span>
                  <span>Skills improved during character finalization</span>
                </div>
              </div>
            )}

            <h4 className="text-md font-semibold text-white mb-2">Complete Equipment</h4>
            <ul className="text-sm text-slate-300 mb-4 list-disc list-inside">
              {[...selectedBackgroundPackage.equipment, ...selectedCareerPackage.equipment].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h4 className="text-md font-semibold text-white mb-2">All Benefits</h4>
            <div className="text-sm text-slate-300">
              {(() => {
                const allBenefits = [...selectedBackgroundPackage.benefits, ...selectedCareerPackage.benefits];
                
                // Add the selected benefit from finalization if one was chosen
                if (selectedBenefit !== null) {
                  const finalizationBenefits = [
                    "1 Ship Share",
                    "Cr100000 in cash", 
                    "Combat implant",
                    "1 Ally and 2 Contacts",
                    "TAS Membership",
                    "SOC+1"
                  ];
                  allBenefits.push(finalizationBenefits[selectedBenefit]);
                }
                
                return allBenefits.join(', ');
              })()}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setFinalizingStep('benefits')}
            className="btn-secondary"
          >
            ← Back to Benefits
          </button>
          <div className="flex gap-3">
            <button
              onClick={finalizeCharacter}
              className="btn-primary"
            >
              Complete Character Creation ✨
            </button>
            <button
              onClick={exportToFoundry}
              className="btn-secondary"
            >
              Export FVTT JSON
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="package-based-creation">
      <div className="max-w-6xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            {['characteristics', 'background', 'career', 'finalize'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-blue-500 text-white' 
                    : ['characteristics', 'background', 'career', 'finalize'].indexOf(currentStep) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-600 text-slate-400'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    ['characteristics', 'background', 'career', 'finalize'].indexOf(currentStep) > index
                      ? 'bg-green-500'
                      : 'bg-slate-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-slate-400 text-sm">
            Package-Based Character Creation
          </div>
        </div>

        {/* Step content */}
        {currentStep === 'characteristics' && renderCharacteristicsStep()}
        {currentStep === 'background' && renderBackgroundStep()}
        {currentStep === 'career' && renderCareerStep()}
        {currentStep === 'finalize' && renderFinalizeStep()}

        {/* Back to home */}
        <div className="text-center mt-8">
          {onBack && (
            <button onClick={onBack} className="btn-secondary">
              ← Back to Home
            </button>
          )}
        </div>
      </div>

      {/* Skill Choice Modal */}
      {showSkillChoiceModal && <SkillChoiceModal />}
    </div>
  );
};
