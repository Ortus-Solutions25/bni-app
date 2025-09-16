# Implement Matrix Comparison Analysis System

## Objective
Build the matrix comparison functionality from the original BNI PALMS analysis that allows side-by-side comparison of interaction matrices across different time periods to track chapter progress and member relationship development.

## Context
The original Streamlit application includes a sophisticated comparison feature that allows users to:
- Compare matrices between different weeks/months
- Track interaction progression over time
- Identify improving vs. declining relationships
- Analyze chapter growth patterns
- Generate delta reports showing changes

**Current State:** React/Django app generates individual matrices but lacks comparison functionality
**Missing Feature:** Time-based matrix comparison and delta analysis

## Business Value
- **Progress Tracking**: Monitor how member relationships evolve over time
- **Performance Trends**: Identify chapters that are improving vs. stagnating
- **Member Development**: Track individual members' networking growth
- **Strategic Insights**: Understand seasonal patterns and chapter lifecycle trends
- **Goal Achievement**: Measure progress toward chapter interaction targets
- **Coaching Opportunities**: Identify members who need relationship-building support

## Technical Requirements

### Enhanced Data Models
```python
# models.py - Add comparison tracking
class MatrixSnapshot(models.Model):
    """
    Store matrix snapshots for historical comparison
    """
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    snapshot_date = models.DateField()
    week_of = models.DateField()
    matrix_type = models.CharField(
        max_length=20,
        choices=[
            ('referral', 'Referral Matrix'),
            ('one_to_one', 'One-to-One Matrix'),
            ('combination', 'Combination Matrix')
        ]
    )

    # Aggregated statistics for quick comparison
    total_interactions = models.PositiveIntegerField(default=0)
    interaction_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    complete_interactions = models.PositiveIntegerField(default=0)
    partial_interactions = models.PositiveIntegerField(default=0)
    no_interactions = models.PositiveIntegerField(default=0)

    # Metadata
    member_count = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['chapter', 'week_of', 'matrix_type']
        indexes = [
            models.Index(fields=['chapter', 'matrix_type', 'week_of']),
            models.Index(fields=['snapshot_date']),
        ]

class MatrixComparison(models.Model):
    """
    Store comparison results between two matrix snapshots
    """
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    baseline_snapshot = models.ForeignKey(
        MatrixSnapshot,
        on_delete=models.CASCADE,
        related_name='comparisons_as_baseline'
    )
    comparison_snapshot = models.ForeignKey(
        MatrixSnapshot,
        on_delete=models.CASCADE,
        related_name='comparisons_as_comparison'
    )

    # Delta calculations
    interaction_rate_delta = models.DecimalField(max_digits=6, decimal_places=2)
    total_interactions_delta = models.IntegerField()
    complete_interactions_delta = models.IntegerField()

    # Member-level changes
    improved_members = models.JSONField(default=list)
    declined_members = models.JSONField(default=list)
    new_members = models.JSONField(default=list)
    departed_members = models.JSONField(default=list)

    comparison_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['baseline_snapshot', 'comparison_snapshot']

class MemberInteractionHistory(models.Model):
    """
    Track individual member interaction changes over time
    """
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    snapshot = models.ForeignKey(MatrixSnapshot, on_delete=models.CASCADE)

    # Current period metrics
    given_interactions = models.PositiveIntegerField(default=0)
    received_interactions = models.PositiveIntegerField(default=0)
    complete_interactions_given = models.PositiveIntegerField(default=0)
    complete_interactions_received = models.PositiveIntegerField(default=0)

    # Calculated scores
    interaction_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    networking_grade = models.CharField(
        max_length=2,
        choices=[
            ('A+', 'Exceptional (90-100%)'),
            ('A', 'Excellent (80-89%)'),
            ('B', 'Good (70-79%)'),
            ('C', 'Average (60-69%)'),
            ('D', 'Below Average (50-59%)'),
            ('F', 'Needs Improvement (<50%)')
        ],
        default='F'
    )

    class Meta:
        unique_together = ['member', 'snapshot']
```

### Comparison Analysis API
```python
# views.py - Matrix comparison endpoints
class MatrixComparisonView(APIView):
    """
    Generate comparison analysis between two time periods
    """
    def post(self, request, chapter_id):
        baseline_week = request.data.get('baseline_week')
        comparison_week = request.data.get('comparison_week')
        matrix_type = request.data.get('matrix_type', 'combination')

        # Get or create snapshots for both periods
        baseline_snapshot = self.get_or_create_snapshot(
            chapter_id, baseline_week, matrix_type
        )
        comparison_snapshot = self.get_or_create_snapshot(
            chapter_id, comparison_week, matrix_type
        )

        # Generate comparison analysis
        comparison_data = self.generate_comparison_analysis(
            baseline_snapshot, comparison_snapshot
        )

        # Store comparison for future reference
        matrix_comparison, created = MatrixComparison.objects.get_or_create(
            chapter_id=chapter_id,
            baseline_snapshot=baseline_snapshot,
            comparison_snapshot=comparison_snapshot,
            defaults=comparison_data['summary']
        )

        return Response({
            'comparison_id': matrix_comparison.id,
            'baseline_period': baseline_week,
            'comparison_period': comparison_week,
            'matrix_type': matrix_type,
            'analysis': comparison_data
        })

    def get_or_create_snapshot(self, chapter_id, week_of, matrix_type):
        """Create matrix snapshot if it doesn't exist"""
        snapshot, created = MatrixSnapshot.objects.get_or_create(
            chapter_id=chapter_id,
            week_of=week_of,
            matrix_type=matrix_type,
            defaults={
                'snapshot_date': timezone.now().date()
            }
        )

        if created:
            # Calculate and store snapshot data
            self.populate_snapshot_data(snapshot)

        return snapshot

    def generate_comparison_analysis(self, baseline, comparison):
        """Generate comprehensive comparison analysis"""
        # Overall chapter metrics comparison
        chapter_comparison = {
            'interaction_rate_change': comparison.interaction_rate - baseline.interaction_rate,
            'total_interactions_change': comparison.total_interactions - baseline.total_interactions,
            'complete_interactions_change': comparison.complete_interactions - baseline.complete_interactions,
            'member_count_change': comparison.member_count - baseline.member_count,
            'improvement_percentage': self.calculate_improvement_percentage(baseline, comparison)
        }

        # Member-level comparison
        member_analysis = self.analyze_member_changes(baseline, comparison)

        # Relationship-level comparison
        relationship_analysis = self.analyze_relationship_changes(baseline, comparison)

        # Trend analysis
        trend_analysis = self.calculate_trend_indicators(baseline, comparison)

        return {
            'summary': chapter_comparison,
            'member_analysis': member_analysis,
            'relationship_analysis': relationship_analysis,
            'trends': trend_analysis,
            'recommendations': self.generate_recommendations(chapter_comparison, member_analysis)
        }

    def analyze_member_changes(self, baseline, comparison):
        """Analyze changes at individual member level"""
        baseline_members = self.get_member_metrics(baseline)
        comparison_members = self.get_member_metrics(comparison)

        improved_members = []
        declined_members = []
        new_members = []
        stable_members = []

        for member_id, comparison_metrics in comparison_members.items():
            if member_id not in baseline_members:
                new_members.append({
                    'member_id': member_id,
                    'member_name': comparison_metrics['name'],
                    'current_score': comparison_metrics['score']
                })
            else:
                baseline_score = baseline_members[member_id]['score']
                score_change = comparison_metrics['score'] - baseline_score

                member_change = {
                    'member_id': member_id,
                    'member_name': comparison_metrics['name'],
                    'baseline_score': baseline_score,
                    'comparison_score': comparison_metrics['score'],
                    'score_change': score_change,
                    'percentage_change': (score_change / baseline_score * 100) if baseline_score > 0 else 0
                }

                if score_change > 0.1:  # Significant improvement
                    improved_members.append(member_change)
                elif score_change < -0.1:  # Significant decline
                    declined_members.append(member_change)
                else:
                    stable_members.append(member_change)

        # Identify departed members
        departed_members = []
        for member_id, baseline_metrics in baseline_members.items():
            if member_id not in comparison_members:
                departed_members.append({
                    'member_id': member_id,
                    'member_name': baseline_metrics['name'],
                    'last_score': baseline_metrics['score']
                })

        return {
            'improved_members': sorted(improved_members, key=lambda x: x['score_change'], reverse=True),
            'declined_members': sorted(declined_members, key=lambda x: x['score_change']),
            'new_members': new_members,
            'departed_members': departed_members,
            'stable_members': stable_members,
            'improvement_summary': {
                'total_improved': len(improved_members),
                'total_declined': len(declined_members),
                'total_new': len(new_members),
                'total_departed': len(departed_members),
                'net_member_change': len(new_members) - len(departed_members)
            }
        }

class HistoricalTrendsView(APIView):
    """
    Provide historical trend analysis across multiple time periods
    """
    def get(self, request, chapter_id):
        periods = int(request.GET.get('periods', 12))  # Default 12 weeks
        matrix_type = request.GET.get('matrix_type', 'combination')

        # Get historical snapshots
        snapshots = MatrixSnapshot.objects.filter(
            chapter_id=chapter_id,
            matrix_type=matrix_type
        ).order_by('-week_of')[:periods]

        if len(snapshots) < 2:
            return Response({
                'error': 'Insufficient historical data for trend analysis',
                'available_snapshots': len(snapshots)
            })

        # Calculate trends
        trend_data = self.calculate_historical_trends(snapshots)

        return Response({
            'chapter_id': chapter_id,
            'matrix_type': matrix_type,
            'periods_analyzed': len(snapshots),
            'trends': trend_data
        })

    def calculate_historical_trends(self, snapshots):
        """Calculate various trend indicators"""
        # Time series data
        timeline = []
        for snapshot in reversed(snapshots):
            timeline.append({
                'week_of': snapshot.week_of,
                'interaction_rate': float(snapshot.interaction_rate),
                'total_interactions': snapshot.total_interactions,
                'complete_interactions': snapshot.complete_interactions,
                'member_count': snapshot.member_count
            })

        # Calculate moving averages
        moving_averages = self.calculate_moving_averages(timeline)

        # Identify trends
        trend_direction = self.identify_trend_direction(timeline)

        # Seasonal patterns
        seasonal_analysis = self.analyze_seasonal_patterns(timeline)

        return {
            'timeline': timeline,
            'moving_averages': moving_averages,
            'trend_direction': trend_direction,
            'seasonal_patterns': seasonal_analysis,
            'key_insights': self.generate_trend_insights(timeline, trend_direction)
        }
```

### Frontend Comparison Component
```typescript
// MatrixComparison.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, subWeeks, parseISO } from 'date-fns';

interface ComparisonProps {
  chapterId: string;
}

interface ComparisonPeriod {
  label: string;
  weeks: number;
}

const MatrixComparison: React.FC<ComparisonProps> = ({ chapterId }) => {
  const [baselineWeek, setBaselineWeek] = useState(
    format(subWeeks(new Date(), 4), 'yyyy-MM-dd')
  );
  const [comparisonWeek, setComparisonWeek] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [matrixType, setMatrixType] = useState('combination');

  const comparisonMutation = useMutation({
    mutationFn: (params: any) => generateMatrixComparison(params),
  });

  const quickComparisons: ComparisonPeriod[] = [
    { label: 'Last Week vs This Week', weeks: 1 },
    { label: 'Last Month vs This Month', weeks: 4 },
    { label: 'Last Quarter vs This Quarter', weeks: 12 },
    { label: 'Same Period Last Year', weeks: 52 }
  ];

  const handleQuickComparison = (period: ComparisonPeriod) => {
    const today = new Date();
    const comparisonDate = format(today, 'yyyy-MM-dd');
    const baselineDate = format(subWeeks(today, period.weeks), 'yyyy-MM-dd');

    setBaselineWeek(baselineDate);
    setComparisonWeek(comparisonDate);
  };

  const handleGenerateComparison = () => {
    comparisonMutation.mutate({
      chapter_id: chapterId,
      baseline_week: baselineWeek,
      comparison_week: comparisonWeek,
      matrix_type: matrixType
    });
  };

  const renderComparisonResults = () => {
    if (!comparisonMutation.data) return null;

    const { analysis } = comparisonMutation.data;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ComparisonCard
            title="Interaction Rate"
            baseline={analysis.summary.baseline_interaction_rate}
            comparison={analysis.summary.comparison_interaction_rate}
            change={analysis.summary.interaction_rate_change}
            unit="%"
          />
          <ComparisonCard
            title="Total Interactions"
            baseline={analysis.summary.baseline_total}
            comparison={analysis.summary.comparison_total}
            change={analysis.summary.total_interactions_change}
            unit=""
          />
          <ComparisonCard
            title="Complete Interactions"
            baseline={analysis.summary.baseline_complete}
            comparison={analysis.summary.comparison_complete}
            change={analysis.summary.complete_interactions_change}
            unit=""
          />
          <ComparisonCard
            title="Member Count"
            baseline={analysis.summary.baseline_members}
            comparison={analysis.summary.comparison_members}
            change={analysis.summary.member_count_change}
            unit=""
          />
        </div>

        {/* Member Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MemberImprovementPanel
            improvedMembers={analysis.member_analysis.improved_members}
            title="Most Improved Members"
            type="improvement"
          />
          <MemberImprovementPanel
            improvedMembers={analysis.member_analysis.declined_members}
            title="Members Needing Support"
            type="decline"
          />
        </div>

        {/* Recommendations */}
        <RecommendationsPanel
          recommendations={analysis.recommendations}
        />

        {/* Trend Visualization */}
        <TrendChart
          baselineData={analysis.baseline_matrix}
          comparisonData={analysis.comparison_matrix}
          matrixType={matrixType}
        />
      </div>
    );
  };

  return (
    <div className="matrix-comparison-container">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Matrix Comparison Analysis</h2>

        {/* Quick Comparison Buttons */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Comparisons:</h3>
          <div className="flex flex-wrap gap-2">
            {quickComparisons.map((period) => (
              <button
                key={period.label}
                onClick={() => handleQuickComparison(period)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Baseline Period
            </label>
            <input
              type="date"
              value={baselineWeek}
              onChange={(e) => setBaselineWeek(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comparison Period
            </label>
            <input
              type="date"
              value={comparisonWeek}
              onChange={(e) => setComparisonWeek(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matrix Type
            </label>
            <select
              value={matrixType}
              onChange={(e) => setMatrixType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="combination">Combination Matrix</option>
              <option value="referral">Referral Matrix</option>
              <option value="one_to_one">One-to-One Matrix</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateComparison}
              disabled={comparisonMutation.isPending}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {comparisonMutation.isPending ? 'Analyzing...' : 'Generate Comparison'}
            </button>
          </div>
        </div>
      </div>

      {comparisonMutation.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">Error generating comparison: {comparisonMutation.error.message}</p>
        </div>
      )}

      {renderComparisonResults()}
    </div>
  );
};

const ComparisonCard: React.FC<{
  title: string;
  baseline: number;
  comparison: number;
  change: number;
  unit: string;
}> = ({ title, baseline, comparison, change, unit }) => {
  const isPositive = change > 0;
  const changeColor = isPositive ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="space-y-1">
        <div className="text-2xl font-bold">
          {comparison.toFixed(unit === '%' ? 1 : 0)}{unit}
        </div>
        <div className="text-sm text-gray-600">
          Baseline: {baseline.toFixed(unit === '%' ? 1 : 0)}{unit}
        </div>
        <div className={`text-sm font-medium ${changeColor}`}>
          {isPositive ? '↗' : change < 0 ? '↘' : '→'} {Math.abs(change).toFixed(unit === '%' ? 1 : 0)}{unit}
        </div>
      </div>
    </div>
  );
};

export default MatrixComparison;
```

## Files to Create/Modify

### Backend
- `analytics/models.py` (add MatrixSnapshot, MatrixComparison, MemberInteractionHistory)
- `analytics/views.py` (add MatrixComparisonView, HistoricalTrendsView)
- `analytics/serializers.py` (add comparison serializers)
- `analytics/tasks.py` (add automated snapshot generation)

### Frontend
- `src/components/analytics/MatrixComparison.tsx` (new)
- `src/components/analytics/TrendChart.tsx` (new)
- `src/components/analytics/ComparisonCard.tsx` (new)
- `src/services/comparisonService.ts` (new)

## Success Metrics
- [ ] Comparison analysis completes in under 3 seconds
- [ ] Historical trends show accurate progression patterns
- [ ] Member improvement tracking identifies coaching opportunities
- [ ] Export functionality maintains data integrity
- [ ] Side-by-side matrix visualization is intuitive
- [ ] Automated recommendations are actionable

## Git Workflow
```bash
git checkout -b feat/matrix-comparison-system
# Implement comparison models and APIs
# Create comparison visualization components
# Add historical trend analysis
# Test with multiple time periods
npm test
npm run build
git add .
git commit -m "feat: implement matrix comparison analysis system

- Add MatrixSnapshot model for historical tracking
- Create comprehensive comparison analysis with delta calculations
- Implement member-level improvement tracking and recommendations
- Add historical trend analysis across multiple periods
- Build interactive comparison visualization with side-by-side matrices
- Include automated insights and coaching recommendations

Enables time-based progress tracking matching original PALMS functionality"
git push origin feat/matrix-comparison-system
```

## Notes
- This feature provides critical longitudinal analysis capabilities
- Essential for tracking chapter progress and member development over time
- Enables data-driven coaching and chapter management decisions
- Maintains compatibility with the original PALMS analysis methodology