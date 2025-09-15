# Implement Combination Matrix Analysis

## Objective
Implement the sophisticated Combination Matrix functionality from the original BNI PALMS analysis that provides coded interaction analysis between members using a 4-level interaction classification system.

## Context
The original BNI PALMS Streamlit application includes a unique "Combination Matrix" that goes beyond simple referral and one-to-one tracking. This matrix uses numeric codes to represent different types of member interactions:

**Combination Matrix Codes:**
- **0**: No interaction between members
- **1**: One-to-One meeting only (OTO without referral)
- **2**: Referral only (referral without OTO meeting)
- **3**: Both OTO and referral (complete interaction)

**Current State:** React/Django app has basic referral and OTO matrices but lacks the combination analysis
**Missing Feature:** The sophisticated interaction classification and visualization

## Business Value
- **Interaction Quality Assessment**: Identifies which relationships are fully developed (code 3) vs partial (codes 1-2)
- **Member Coaching**: Helps chapter leaders identify members who give referrals without meetings or vice versa
- **Relationship Strength Analysis**: Quantifies the depth of member connections
- **Strategic Planning**: Guides chapters on where to focus relationship-building efforts
- **Performance Benchmarking**: Provides a standardized way to measure interaction completeness

## Technical Requirements

### Data Model Enhancement
```python
# models.py - Add combination analysis fields
class MemberInteraction(models.Model):
    """
    Enhanced model to track combination interactions
    """
    giver = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='given_interactions')
    receiver = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='received_interactions')
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)

    # Existing fields
    has_referral = models.BooleanField(default=False)
    referral_count = models.PositiveIntegerField(default=0)
    has_one_to_one = models.BooleanField(default=False)
    one_to_one_count = models.PositiveIntegerField(default=0)

    # New combination analysis fields
    combination_code = models.PositiveSmallIntegerField(
        choices=[
            (0, 'No Interaction'),
            (1, 'OTO Only'),
            (2, 'Referral Only'),
            (3, 'Both OTO and Referral')
        ],
        default=0
    )

    interaction_strength = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        help_text="Calculated strength score based on interaction type and frequency"
    )

    last_updated = models.DateTimeField(auto_now=True)
    week_of = models.DateField()

    class Meta:
        unique_together = ['giver', 'receiver', 'week_of']
        indexes = [
            models.Index(fields=['chapter', 'week_of']),
            models.Index(fields=['combination_code']),
        ]

    def calculate_combination_code(self):
        """Calculate the combination code based on referral and OTO status"""
        if self.has_one_to_one and self.has_referral:
            return 3  # Both
        elif self.has_one_to_one and not self.has_referral:
            return 1  # OTO only
        elif not self.has_one_to_one and self.has_referral:
            return 2  # Referral only
        else:
            return 0  # No interaction

    def calculate_interaction_strength(self):
        """Calculate interaction strength score"""
        base_scores = {0: 0, 1: 0.5, 2: 0.7, 3: 1.0}
        base_score = base_scores[self.combination_code]

        # Frequency multiplier
        frequency_factor = min((self.referral_count + self.one_to_one_count) * 0.1, 0.5)

        return min(base_score + frequency_factor, 1.0)

    def save(self, *args, **kwargs):
        self.combination_code = self.calculate_combination_code()
        self.interaction_strength = self.calculate_interaction_strength()
        super().save(*args, **kwargs)
```

### Backend API Implementation
```python
# views.py - Combination Matrix API
class CombinationMatrixView(APIView):
    """
    Generate combination matrix data for visualization
    """
    def get(self, request, chapter_id):
        week_of = request.GET.get('week_of')

        # Get all members in chapter
        members = Member.objects.filter(chapter_id=chapter_id)
        member_list = list(members.values_list('id', 'name'))

        # Build combination matrix
        matrix_data = []
        for giver_id, giver_name in member_list:
            row_data = {
                'giver_id': giver_id,
                'giver_name': giver_name,
                'interactions': []
            }

            for receiver_id, receiver_name in member_list:
                if giver_id == receiver_id:
                    # Self-interaction is not applicable
                    code = None
                else:
                    interaction = MemberInteraction.objects.filter(
                        giver_id=giver_id,
                        receiver_id=receiver_id,
                        chapter_id=chapter_id,
                        week_of=week_of
                    ).first()

                    code = interaction.combination_code if interaction else 0

                row_data['interactions'].append({
                    'receiver_id': receiver_id,
                    'receiver_name': receiver_name,
                    'code': code
                })

            matrix_data.append(row_data)

        # Calculate matrix statistics
        stats = self.calculate_matrix_statistics(matrix_data)

        return Response({
            'matrix_data': matrix_data,
            'statistics': stats,
            'week_of': week_of,
            'chapter_id': chapter_id
        })

    def calculate_matrix_statistics(self, matrix_data):
        """Calculate comprehensive statistics for the combination matrix"""
        total_possible = 0
        code_counts = {0: 0, 1: 0, 2: 0, 3: 0}

        for row in matrix_data:
            for interaction in row['interactions']:
                if interaction['code'] is not None:  # Skip self-interactions
                    total_possible += 1
                    code_counts[interaction['code']] += 1

        return {
            'total_possible_interactions': total_possible,
            'no_interaction_count': code_counts[0],
            'oto_only_count': code_counts[1],
            'referral_only_count': code_counts[2],
            'both_count': code_counts[3],
            'interaction_rate': round((total_possible - code_counts[0]) / total_possible * 100, 2) if total_possible > 0 else 0,
            'complete_interaction_rate': round(code_counts[3] / total_possible * 100, 2) if total_possible > 0 else 0,
            'partial_interaction_rate': round((code_counts[1] + code_counts[2]) / total_possible * 100, 2) if total_possible > 0 else 0
        }

class InteractionAnalysisView(APIView):
    """
    Provide detailed analysis of member interaction patterns
    """
    def get(self, request, chapter_id):
        # Member-specific analysis
        members_analysis = []
        members = Member.objects.filter(chapter_id=chapter_id)

        for member in members:
            given_interactions = MemberInteraction.objects.filter(
                giver=member,
                chapter_id=chapter_id
            )
            received_interactions = MemberInteraction.objects.filter(
                receiver=member,
                chapter_id=chapter_id
            )

            member_stats = {
                'member_id': member.id,
                'member_name': member.name,
                'given_analysis': self.analyze_interactions(given_interactions),
                'received_analysis': self.analyze_interactions(received_interactions),
                'interaction_balance': self.calculate_interaction_balance(given_interactions, received_interactions)
            }

            members_analysis.append(member_stats)

        return Response({
            'members_analysis': members_analysis,
            'chapter_id': chapter_id
        })

    def analyze_interactions(self, interactions):
        """Analyze a set of interactions for patterns"""
        total = interactions.count()
        code_distribution = {
            0: interactions.filter(combination_code=0).count(),
            1: interactions.filter(combination_code=1).count(),
            2: interactions.filter(combination_code=2).count(),
            3: interactions.filter(combination_code=3).count()
        }

        avg_strength = interactions.aggregate(
            avg_strength=models.Avg('interaction_strength')
        )['avg_strength'] or 0

        return {
            'total_interactions': total,
            'code_distribution': code_distribution,
            'average_strength': round(avg_strength, 2),
            'complete_interaction_percentage': round((code_distribution[3] / total * 100) if total > 0 else 0, 2)
        }
```

### Frontend Combination Matrix Component
```typescript
// CombinationMatrix.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CombinationMatrixProps {
  chapterId: string;
  weekOf: string;
}

interface MatrixCell {
  receiver_id: string;
  receiver_name: string;
  code: number | null;
}

interface MatrixRow {
  giver_id: string;
  giver_name: string;
  interactions: MatrixCell[];
}

const CombinationMatrix: React.FC<CombinationMatrixProps> = ({ chapterId, weekOf }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['combinationMatrix', chapterId, weekOf],
    queryFn: () => fetchCombinationMatrix(chapterId, weekOf)
  });

  const getCellColor = (code: number | null): string => {
    const colorMap = {
      0: 'bg-gray-100',      // No interaction - light gray
      1: 'bg-blue-200',      // OTO only - light blue
      2: 'bg-yellow-200',    // Referral only - light yellow
      3: 'bg-green-200',     // Both - light green
      null: 'bg-gray-300'    // Self-interaction - darker gray
    };
    return colorMap[code ?? 'null'] || 'bg-white';
  };

  const getCellText = (code: number | null): string => {
    if (code === null) return '-';
    return code.toString();
  };

  const getCellTooltip = (code: number | null, giverName: string, receiverName: string): string => {
    const descriptions = {
      0: 'No interaction',
      1: 'One-to-One meeting only',
      2: 'Referral only',
      3: 'Both OTO and referral',
      null: 'Self-interaction (not applicable)'
    };

    const description = descriptions[code ?? 'null'];
    return `${giverName} → ${receiverName}: ${description}`;
  };

  if (isLoading) return <div>Loading combination matrix...</div>;
  if (error) return <div>Error loading matrix data</div>;
  if (!data) return null;

  return (
    <div className="combination-matrix-container">
      {/* Statistics Panel */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Interaction Rate</h3>
          <p className="text-2xl font-bold text-blue-600">
            {data.statistics.interaction_rate}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Complete Interactions</h3>
          <p className="text-2xl font-bold text-green-600">
            {data.statistics.complete_interaction_rate}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Partial Interactions</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {data.statistics.partial_interaction_rate}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">No Interaction</h3>
          <p className="text-2xl font-bold text-gray-600">
            {data.statistics.no_interaction_count}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border"></div>
          <span className="text-sm">0 - No Interaction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border"></div>
          <span className="text-sm">1 - OTO Only</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 border"></div>
          <span className="text-sm">2 - Referral Only</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 border"></div>
          <span className="text-sm">3 - Both OTO & Referral</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-50 p-2 text-left font-medium">
                Giver ↓ / Receiver →
              </th>
              {data.matrix_data[0]?.interactions.map((interaction: MatrixCell) => (
                <th
                  key={interaction.receiver_id}
                  className="border border-gray-300 bg-gray-50 p-2 text-center font-medium min-w-[60px]"
                  title={interaction.receiver_name}
                >
                  {interaction.receiver_name.split(' ').map(name => name[0]).join('')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix_data.map((row: MatrixRow) => (
              <tr key={row.giver_id}>
                <td className="border border-gray-300 bg-gray-50 p-2 font-medium">
                  {row.giver_name}
                </td>
                {row.interactions.map((cell: MatrixCell) => (
                  <td
                    key={`${row.giver_id}-${cell.receiver_id}`}
                    className={`border border-gray-300 p-2 text-center font-mono ${getCellColor(cell.code)}`}
                    title={getCellTooltip(cell.code, row.giver_name, cell.receiver_name)}
                  >
                    {getCellText(cell.code)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Options */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => exportToExcel(data)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export to Excel
        </button>
        <button
          onClick={() => exportToPDF(data)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
};

export default CombinationMatrix;
```

## Files to Create/Modify

### Backend
- `analytics/models.py` (add MemberInteraction model)
- `analytics/views.py` (add CombinationMatrixView, InteractionAnalysisView)
- `analytics/serializers.py` (add combination matrix serializers)
- `analytics/urls.py` (add combination matrix endpoints)

### Frontend
- `src/components/analytics/CombinationMatrix.tsx` (new)
- `src/components/analytics/InteractionAnalysis.tsx` (new)
- `src/services/combinationMatrixService.ts` (new)
- `src/types/combinationMatrix.ts` (new)

## Success Metrics
- [ ] Combination matrix displays all 4 interaction codes correctly
- [ ] Statistics calculations match original PALMS analysis
- [ ] Matrix exports to Excel format identical to original
- [ ] Performance handles chapters with 50+ members
- [ ] Matrix updates in real-time as data changes
- [ ] Color coding is intuitive and accessible

## Git Workflow
```bash
git checkout -b feat/combination-matrix-analysis
# Implement backend models and APIs
# Create frontend matrix visualization
# Add export functionality
# Test with sample data
npm test
npm run build
git add .
git commit -m "feat: implement combination matrix analysis from PALMS

- Add MemberInteraction model with combination code calculation
- Create combination matrix visualization with 4-level interaction codes
- Implement comprehensive interaction statistics and analysis
- Add Excel/PDF export functionality matching original PALMS format
- Include member-specific interaction pattern analysis

Ports the sophisticated interaction analysis from original Streamlit app"
git push origin feat/combination-matrix-analysis
```

## Notes
- This is the most sophisticated and unique feature from the original PALMS analysis
- The 4-level coding system provides deeper insights than simple referral/OTO counting
- Critical for maintaining feature parity with the original Streamlit application
- Enables advanced coaching and relationship development strategies for BNI chapters