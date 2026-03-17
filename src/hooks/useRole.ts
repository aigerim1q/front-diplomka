import { useTranslation } from 'react-i18next'
import { UserRole, TenantType } from '@/types'

export const useRole = () => {
  const { t } = useTranslation()

  const getRoleName = (role: UserRole): string => {
    const roles: Record<UserRole, string> = {
      1: t('users.roles.superAdmin'),
      2: t('users.roles.constructionAdmin'),
      3: t('users.roles.kskAdmin'),
      4: t('users.roles.businessAdmin'),
      5: t('users.roles.resident'),
    }
    return roles[role]
  }

  const getTenantTypeName = (type: TenantType): string => {
    const types: Record<TenantType, string> = {
      1: t('tenants.types.constructionCompany'),
      2: t('tenants.types.ksk'),
      3: t('tenants.types.business'),
    }
    return types[type]
  }

  const getStatusName = (status: 1 | 2): string => {
    return status === 1 ? t('common.active') : t('common.blocked')
  }

  return { getRoleName, getTenantTypeName, getStatusName }
}