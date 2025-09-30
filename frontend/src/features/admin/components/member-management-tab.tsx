import React from 'react';
import { Download, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChapterMemberData } from '../../../shared/services/ChapterDataLoader';
import { useMemberManagement } from '../hooks/useMemberManagement';

interface MemberManagementTabProps {
  chapterData: ChapterMemberData[];
  onDataRefresh: () => void;
}

export const MemberManagementTab: React.FC<MemberManagementTabProps> = ({
  chapterData,
  onDataRefresh,
}) => {
  const {
    members,
    filteredMembers,
    filters,
    setFilters,
    selectedMembers,
    handleMemberSelect,
    handleSelectAll,
    handleBulkDelete,
    exportMemberData,
  } = useMemberManagement(chapterData);

  const totalMembers = members.length;
  const filteredCount = filteredMembers.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Member Management</h2>
        <p className="text-muted-foreground">
          Manage all members across all chapters. Perform bulk operations and export member data.
        </p>
      </div>

      {/* Filters and Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search members by name, business, classification, or chapter..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="min-w-[200px]">
                <Select
                  value={filters.chapterFilter}
                  onValueChange={(value) => setFilters({ ...filters, chapterFilter: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chapters ({totalMembers} members)</SelectItem>
                    {chapterData.map((chapter) => (
                      <SelectItem key={chapter.chapterId} value={chapter.chapterId}>
                        {chapter.chapterName} ({chapter.members.length} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={exportMemberData}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              {selectedMembers.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleBulkDelete();
                    onDataRefresh();
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedMembers.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Members</CardTitle>
            <Badge variant="secondary">
              {filteredCount} of {totalMembers} members
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all members"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member, index) => (
                  <TableRow key={`${member.chapterName}-${index}`}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(`${member.chapterName}-${index}`)}
                        onChange={(e) => handleMemberSelect(`${member.chapterName}-${index}`, e.target.checked)}
                        aria-label={`Select ${member.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{member.name || 'N/A'}</TableCell>
                    <TableCell>N/A</TableCell>
                    <TableCell>N/A</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.chapterName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" aria-label={`Edit ${member.name}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label={`Delete ${member.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
