import { useState, useEffect } from 'react';
import { MatrixData, TYFCBData } from '../types/matrix.types';
import { MonthlyReport, loadMonthlyReports, loadMatrixData } from '../../../shared/services/ChapterDataLoader';
import { API_BASE_URL } from '@/config/api';

interface UseMatrixDataReturn {
  monthlyReports: MonthlyReport[];
  selectedReport: MonthlyReport | null;
  referralMatrix: MatrixData | null;
  oneToOneMatrix: MatrixData | null;
  combinationMatrix: MatrixData | null;
  tyfcbData: TYFCBData | null;
  isLoadingReports: boolean;
  isLoadingMatrices: boolean;
  error: string | null;
  setSelectedReport: (report: MonthlyReport | null) => void;
  handleReportChange: (reportId: string) => void;
}

export const useMatrixData = (chapterId: string): UseMatrixDataReturn => {
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [referralMatrix, setReferralMatrix] = useState<MatrixData | null>(null);
  const [oneToOneMatrix, setOneToOneMatrix] = useState<MatrixData | null>(null);
  const [combinationMatrix, setCombinationMatrix] = useState<MatrixData | null>(null);
  const [tyfcbData, setTyfcbData] = useState<TYFCBData | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isLoadingMatrices, setIsLoadingMatrices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load monthly reports when component mounts
  useEffect(() => {
    const loadReports = async () => {
      if (!chapterId) return;

      setIsLoadingReports(true);
      setError(null);

      try {
        const reports = await loadMonthlyReports(chapterId);
        setMonthlyReports(reports);

        // Select the most recent report by default
        if (reports.length > 0) {
          setSelectedReport(reports[0]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load monthly reports');
      } finally {
        setIsLoadingReports(false);
      }
    };

    loadReports();
  }, [chapterId]);

  // Load matrices when a report is selected
  useEffect(() => {
    const fetchMatrices = async () => {
      if (!selectedReport || !chapterId) return;

      setIsLoadingMatrices(true);
      setError(null);

      // Clear previous matrices
      setReferralMatrix(null);
      setOneToOneMatrix(null);
      setCombinationMatrix(null);
      setTyfcbData(null);

      try {
        // Only load matrices that are available for this report
        const promises = [];

        if (selectedReport.has_referral_matrix) {
          promises.push(loadMatrixData(chapterId, selectedReport.id, 'referral-matrix'));
        } else {
          promises.push(Promise.resolve(null));
        }

        if (selectedReport.has_oto_matrix) {
          promises.push(loadMatrixData(chapterId, selectedReport.id, 'one-to-one-matrix'));
        } else {
          promises.push(Promise.resolve(null));
        }

        if (selectedReport.has_combination_matrix) {
          promises.push(loadMatrixData(chapterId, selectedReport.id, 'combination-matrix'));
        } else {
          promises.push(Promise.resolve(null));
        }

        // Always try to load TYFCB data
        promises.push(
          fetch(`${API_BASE_URL}/api/chapters/${chapterId}/reports/${selectedReport.id}/tyfcb-data/`)
            .then(response => response.json())
            .catch(() => null)
        );

        const [referralData, otoData, combinationData, tyfcbDataResponse] = await Promise.all(promises);

        setReferralMatrix(referralData);
        setOneToOneMatrix(otoData);
        setCombinationMatrix(combinationData);
        setTyfcbData(tyfcbDataResponse);

      } catch (error) {
        console.error('Failed to load matrices:', error);
        setError(error instanceof Error ? error.message : 'Failed to load matrix data');
      } finally {
        setIsLoadingMatrices(false);
      }
    };

    if (selectedReport) {
      fetchMatrices();
    }
  }, [selectedReport, chapterId]);

  const handleReportChange = (reportId: string) => {
    const report = monthlyReports.find(r => r.id === parseInt(reportId));
    setSelectedReport(report || null);
  };

  return {
    monthlyReports,
    selectedReport,
    referralMatrix,
    oneToOneMatrix,
    combinationMatrix,
    tyfcbData,
    isLoadingReports,
    isLoadingMatrices,
    error,
    setSelectedReport,
    handleReportChange,
  };
};
