import { read, utils } from 'xlsx';

export interface ChapterInfo {
  id: string;
  name: string;
  memberFile: string;
}

export interface MonthlyReport {
  id: number;
  month_year: string;
  uploaded_at: string;
  processed_at: string | null;
  slip_audit_file: string | null;
  member_names_file: string | null;
  has_referral_matrix: boolean;
  has_oto_matrix: boolean;
  has_combination_matrix: boolean;
}

export interface MemberDetail {
  member: {
    id: number;
    full_name: string;
    first_name: string;
    last_name: string;
    business_name: string;
    classification: string;
    email: string;
    phone: string;
  };
  stats: {
    referrals_given: number;
    referrals_received: number;
    one_to_ones_completed: number;
    tyfcb_inside_amount: number;
    tyfcb_outside_amount: number;
  };
  missing_interactions: {
    missing_otos: Array<{id: number, name: string}>;
    missing_referrals_given_to: Array<{id: number, name: string}>;
    missing_referrals_received_from: Array<{id: number, name: string}>;
    priority_connections: Array<{id: number, name: string}>;
  };
  monthly_report: {
    id: number;
    month_year: string;
    processed_at: string | null;
  };
}

export interface ChapterMemberData {
  chapterName: string;
  chapterId: string;
  members: string[];
  memberCount: number;
  memberFile: string;
  loadedAt: Date;
  loadError?: string;
  monthlyReports?: MonthlyReport[];
  currentReport?: MonthlyReport;
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

export const loadMonthlyReports = async (chapterId: string): Promise<MonthlyReport[]> => {
  try {
    const response = await fetch(`/api/chapters/${chapterId}/reports/`);
    
    if (!response.ok) {
      throw new Error(`Failed to load monthly reports: ${response.status} ${response.statusText}`);
    }
    
    const reports = await response.json();
    return reports;
  } catch (error) {
    console.error(`Failed to load monthly reports for chapter ${chapterId}:`, error);
    throw error;
  }
};

export const loadMemberDetail = async (
  chapterId: string, 
  reportId: number, 
  memberId: number
): Promise<MemberDetail> => {
  try {
    const response = await fetch(
      `/api/chapters/${chapterId}/reports/${reportId}/members/${memberId}/`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to load member detail: ${response.status} ${response.statusText}`);
    }
    
    const memberDetail = await response.json();
    return memberDetail;
  } catch (error) {
    console.error(`Failed to load member detail for chapter ${chapterId}, report ${reportId}, member ${memberId}:`, error);
    throw error;
  }
};

export const loadMatrixData = async (
  chapterId: string,
  reportId: number,
  matrixType: 'referral-matrix' | 'one-to-one-matrix' | 'combination-matrix'
): Promise<any> => {
  try {
    const response = await fetch(
      `/api/chapters/${chapterId}/reports/${reportId}/${matrixType}/`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to load ${matrixType}: ${response.status} ${response.statusText}`);
    }
    
    const matrixData = await response.json();
    return matrixData;
  } catch (error) {
    console.error(`Failed to load ${matrixType} for chapter ${chapterId}, report ${reportId}:`, error);
    throw error;
  }
};

export const deleteMonthlyReport = async (chapterId: string, reportId: number): Promise<void> => {
  try {
    const response = await fetch(
      `/api/chapters/${chapterId}/reports/${reportId}/`,
      { method: 'DELETE' }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to delete monthly report: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to delete monthly report ${reportId} for chapter ${chapterId}:`, error);
    throw error;
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