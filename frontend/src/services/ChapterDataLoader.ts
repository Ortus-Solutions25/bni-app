import { read, utils } from 'xlsx';

export interface ChapterInfo {
  id: string;
  name: string;
  memberFile: string;
}

export interface ChapterMemberData {
  chapterName: string;
  chapterId: string;
  members: string[];
  memberCount: number;
  memberFile: string;
  loadedAt: Date;
  loadError?: string;
  performanceMetrics?: {
    avgReferralsPerMember: number;
    avgOTOsPerMember: number;
    totalTYFCB: number;
    topPerformer: string;
  };
}

export const REAL_CHAPTERS: ChapterInfo[] = [
  { id: 'continental', name: 'BNI Continental', memberFile: 'bni-continental.xls' },
  { id: 'elevate', name: 'BNI Elevate', memberFile: 'bni-elevate.xls' },
  { id: 'energy', name: 'BNI Energy', memberFile: 'bni-energy.xls' },
  { id: 'excelerate', name: 'BNI Excelerate', memberFile: 'bni-excelerate.xls' },
  { id: 'givers', name: 'BNI Givers', memberFile: 'bni-givers.xls' },
  { id: 'gladiators', name: 'BNI Gladiators', memberFile: 'bni-gladiators.xls' },
  { id: 'legends', name: 'BNI Legends', memberFile: 'bni-legends.xls' },
  { id: 'synergy', name: 'BNI Synergy', memberFile: 'bni-synergy.xls' },
  { id: 'united', name: 'BNI United', memberFile: 'bni-united.xls' }
];

export const extractMemberNamesFromFile = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet);
        
        const members: string[] = [];
        jsonData.forEach((row: any) => {
          let firstName = '';
          let lastName = '';
          
          Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('first') && lowerKey.includes('name')) {
              firstName = row[key]?.toString().trim() || '';
            } else if (lowerKey.includes('last') && lowerKey.includes('name')) {
              lastName = row[key]?.toString().trim() || '';
            }
          });
          
          if (firstName && lastName) {
            members.push(`${firstName} ${lastName}`);
          }
        });
        
        resolve(members);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};

const loadChapterFile = async (memberFileName: string): Promise<string[]> => {
  try {
    console.log(`Loading member file: ${memberFileName}`);
    const response = await fetch(`/needed-data/member-names/${memberFileName}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} for file ${memberFileName}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error(`No sheets found in ${memberFileName}`);
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = utils.sheet_to_json(worksheet);
    
    console.log(`Found ${jsonData.length} rows in ${memberFileName}`);
    
    const members: string[] = [];
    jsonData.forEach((row: any, index: number) => {
      let firstName = '';
      let lastName = '';
      
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('first') && lowerKey.includes('name')) {
          firstName = row[key]?.toString().trim() || '';
        } else if (lowerKey.includes('last') && lowerKey.includes('name')) {
          lastName = row[key]?.toString().trim() || '';
        }
      });
      
      if (firstName && lastName) {
        members.push(`${firstName} ${lastName}`);
      }
    });
    
    console.log(`Extracted ${members.length} member names from ${memberFileName}`);
    return members;
  } catch (error) {
    console.error(`Failed to load ${memberFileName}:`, error);
    throw error;
  }
};

export const loadAllChapterData = async (): Promise<ChapterMemberData[]> => {
  try {
    // Call the real backend API
    const response = await fetch('/api/dashboard/');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform API data to match our ChapterMemberData interface
    const results: ChapterMemberData[] = data.chapters.map((chapter: any) => ({
      chapterName: chapter.name,
      chapterId: chapter.id.toString(), // Convert to string for consistency
      members: [], // We'll fetch individual member lists when needed
      memberCount: chapter.member_count,
      memberFile: `${chapter.name.toLowerCase().replace(/\s+/g, '-')}.xls`,
      loadedAt: new Date(),
      performanceMetrics: {
        avgReferralsPerMember: chapter.avg_referrals_per_member || 0,
        avgOTOsPerMember: chapter.avg_otos_per_member || 0,
        totalTYFCB: chapter.total_tyfcb || 0,
        topPerformer: 'Loading...' // Will be loaded with chapter details
      }
    }));
    
    return results;
    
  } catch (error) {
    console.error('Failed to load chapter data from API:', error);
    
    // Fallback to empty chapters with error indication
    return REAL_CHAPTERS.map(chapter => ({
      chapterName: chapter.name,
      chapterId: chapter.id,
      members: [],
      memberCount: 0,
      memberFile: chapter.memberFile,
      loadedAt: new Date(),
      loadError: error instanceof Error ? error.message : 'Unknown error',
      performanceMetrics: {
        avgReferralsPerMember: 0,
        avgOTOsPerMember: 0,
        totalTYFCB: 0,
        topPerformer: 'N/A'
      }
    }));
  }
};

export const generateMockPerformanceMetrics = (members: string[]): ChapterMemberData['performanceMetrics'] => {
  if (members.length === 0) {
    return {
      avgReferralsPerMember: 0,
      avgOTOsPerMember: 0,
      totalTYFCB: 0,
      topPerformer: 'N/A'
    };
  }
  
  return {
    avgReferralsPerMember: Math.floor(Math.random() * 10) + 5,
    avgOTOsPerMember: Math.floor(Math.random() * 8) + 3,
    totalTYFCB: Math.floor(Math.random() * 500000) + 100000,
    topPerformer: members[Math.floor(Math.random() * members.length)]
  };
};