import { TeamMember } from '../types';
import { MOCK_TEAM_MEMBERS } from '../constants';
import { getData, saveData } from './dataService';

const TEAM_MEMBERS_STORAGE_KEY = 'pr-team-members';

export const getTeamMembers = (): TeamMember[] => {
  return getData<TeamMember[]>(TEAM_MEMBERS_STORAGE_KEY, MOCK_TEAM_MEMBERS);
};

export const saveTeamMembers = (members: TeamMember[]): void => {
  saveData<TeamMember[]>(TEAM_MEMBERS_STORAGE_KEY, members);
};
