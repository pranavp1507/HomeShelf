/**
 * Member Service - Business logic for member operations
 */

import { MemberRepository, Member, MemberSearchOptions } from '../repositories/MemberRepository';
import { PaginatedResult } from '../repositories/BaseRepository';
import { AppError } from '../middleware/errorHandler';

export class MemberService {
  private memberRepository: MemberRepository;

  constructor() {
    this.memberRepository = new MemberRepository();
  }

  /**
   * Get all members with search/filter/pagination
   */
  async getMembers(options: MemberSearchOptions): Promise<PaginatedResult<Member>> {
    return await this.memberRepository.search(options);
  }

  /**
   * Get a single member by ID
   */
  async getMemberById(id: number): Promise<Member> {
    const member = await this.memberRepository.findById(id);
    if (!member) {
      throw new AppError('Member not found', 404);
    }
    return member;
  }

  /**
   * Create a new member
   */
  async createMember(data: {
    name: string;
    email: string;
    phone?: string;
  }): Promise<Member> {
    // Check for duplicate email
    const existing = await this.memberRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('A member with this email already exists', 409);
    }

    // Create member
    const member = await this.memberRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone
    });

    return member;
  }

  /**
   * Update a member
   */
  async updateMember(id: number, data: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<Member> {
    // Check member exists
    const existing = await this.memberRepository.findById(id);
    if (!existing) {
      throw new AppError('Member not found', 404);
    }

    // Check email uniqueness if changed
    if (data.email && data.email.toLowerCase() !== existing.email.toLowerCase()) {
      const duplicate = await this.memberRepository.findByEmail(data.email);
      if (duplicate && duplicate.id !== id) {
        throw new AppError('A member with this email already exists', 409);
      }
    }

    // Update member
    const updateData: Partial<Member> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.phone !== undefined) updateData.phone = data.phone;

    const member = await this.memberRepository.update(id, updateData);
    if (!member) {
      throw new AppError('Failed to update member', 500);
    }

    return member;
  }

  /**
   * Delete a member
   */
  async deleteMember(id: number): Promise<void> {
    const member = await this.memberRepository.findById(id);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    const deleted = await this.memberRepository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete member', 500);
    }
  }

  /**
   * Bulk import members from CSV
   */
  async bulkImportMembers(members: Array<{ name: string; email: string; phone?: string }>): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const result = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    const membersToImport: Partial<Member>[] = [];

    for (const memberData of members) {
      // Validate required fields
      if (!memberData.name || !memberData.email) {
        result.skipped++;
        result.errors.push(`Missing required fields for: ${JSON.stringify(memberData)}`);
        continue;
      }

      // Check for duplicate email
      const existing = await this.memberRepository.findByEmail(memberData.email);
      if (existing) {
        result.skipped++;
        result.errors.push(`Duplicate email: ${memberData.email}`);
        continue;
      }

      membersToImport.push({
        name: memberData.name,
        email: memberData.email.toLowerCase(),
        phone: memberData.phone
      });
    }

    if (membersToImport.length > 0) {
      await this.memberRepository.bulkCreate(membersToImport);
      result.imported = membersToImport.length;
    }

    return result;
  }
}
