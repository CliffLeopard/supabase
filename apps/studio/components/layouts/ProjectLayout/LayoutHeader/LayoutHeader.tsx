import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useMemo } from 'react'

import { useParams } from 'common'
import Connect from 'components/interfaces/Connect/Connect'
import AssistantButton from 'components/layouts/AppLayout/AssistantButton'
import BranchDropdown from 'components/layouts/AppLayout/BranchDropdown'
import EnableBranchingButton from 'components/layouts/AppLayout/EnableBranchingButton/EnableBranchingButton'
import OrganizationDropdown from 'components/layouts/AppLayout/OrganizationDropdown'
import ProjectDropdown from 'components/layouts/AppLayout/ProjectDropdown'
import { getResourcesExceededLimitsOrg } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import Image from 'next/image'
import { useAppStateSnapshot } from 'state/app-state'
import { Badge, cn } from 'ui'
import BreadcrumbsView from './BreadcrumbsView'
import { FeedbackDropdown } from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import NotificationsPopoverV2 from './NotificationsPopoverV2/NotificationsPopover'

const LayoutHeaderDivider = () => (
  <span className="text-border-stronger pr-0.5">
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <path d="M16 3.549L7.12 20.600" />
    </svg>
  </span>
)

interface LayoutHeaderProps {
  customHeaderComponents?: ReactNode
  breadcrumbs?: any[]
  headerBorder?: boolean
  hasProductMenu?: boolean
  customSidebarContent?: ReactNode
  headerTitle?: string
  handleMobileMenu: Function
  showHomeLink?: boolean
}

const LayoutHeader = ({
  customHeaderComponents,
  breadcrumbs = [],
  hasProductMenu,
  headerTitle,
}: LayoutHeaderProps) => {
  const { ref: projectRef, slug } = useParams()
  const router = useRouter()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const isBranchingEnabled = selectedProject?.is_branch_enabled === true
  const isOrgPage = router.pathname.startsWith('/org/') // Add this check
  const { aiAssistantPanel, setMobileMenuOpen } = useAppStateSnapshot()

  const { data: subscription } = useOrgSubscriptionQuery({
    orgSlug: selectedOrganization?.slug,
  })

  // We only want to query the org usage and check for possible over-ages for plans without usage billing enabled (free or pro with spend cap)
  const { data: orgUsage } = useOrgUsageQuery(
    { orgSlug: selectedOrganization?.slug },
    { enabled: subscription?.usage_billing_enabled === false }
  )

  const exceedingLimits = useMemo(() => {
    if (orgUsage) {
      return getResourcesExceededLimitsOrg(orgUsage?.usages || []).length > 0
    } else {
      return false
    }
  }, [orgUsage])

  // show org selection if we are on a project page or on a explicit org route
  const showOrgSelection = slug || (selectedOrganization && projectRef)

  return (
    <>
      <header className={cn('flex h-12 items-center flex-shrink-0 border-b')}>
        <div
          className={cn('flex items-center justify-between py-2 pl-5 pr-3 flex-1', {
            'pl-3': !projectRef,
          })}
        >
          {hasProductMenu && (
            <div className="flex items-center justify-center border-r flex-0 md:hidden h-full aspect-square">
              <button
                title="Menu dropdown button"
                className={cn(
                  'group/view-toggle ml-4 flex justify-center flex-col border-none space-x-0 items-start gap-1 !bg-transparent rounded-md min-w-[30px] w-[30px] h-[30px]'
                )}
                onClick={() => setMobileMenuOpen(true)}
              >
                <div className="h-px inline-block left-0 w-4 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
                <div className="h-px inline-block left-0 w-3 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
              </button>
            </div>
          )}
          <div className="flex items-center text-sm">
            {projectRef && (
              <Link
                href={IS_PLATFORM ? `/projects` : `/project/${projectRef}`}
                className="flex items-center justify-center"
              >
                <Image
                  alt="Supabase"
                  src={`${router.basePath}/img/supabase-logo.svg`}
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px]"
                />
              </Link>
            )}

            <>
              <div className={cn('flex items-center pl-2', { 'pl-0': !projectRef })}>
                {showOrgSelection && (
                  <>
                    <LayoutHeaderDivider />
                    <OrganizationDropdown />
                  </>
                )}
                <AnimatePresence>
                  {projectRef && (
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        duration: 0.15,
                        ease: 'easeOut',
                      }}
                    >
                      <LayoutHeaderDivider />
                      <ProjectDropdown />

                      {exceedingLimits && (
                        <div className="ml-2">
                          <Link href={`/org/${selectedOrganization?.slug}/usage`}>
                            <Badge variant="destructive">Exceeding usage limits</Badge>
                          </Link>
                        </div>
                      )}

                      {selectedProject && isBranchingEnabled && (
                        <>
                          <LayoutHeaderDivider />
                          <BranchDropdown />
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {headerTitle && (
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        duration: 0.15,
                        ease: 'easeOut',
                      }}
                    >
                      <LayoutHeaderDivider />
                      <span className="text-foreground">{headerTitle}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {projectRef && (
                  <motion.div
                    className="ml-3 flex items-center gap-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeOut',
                    }}
                  >
                    <Connect />
                    {!isBranchingEnabled && <EnableBranchingButton />}
                  </motion.div>
                )}
              </AnimatePresence>
            </>

            {/* Additional breadcrumbs are supplied */}
            <BreadcrumbsView defaultValue={breadcrumbs} />
          </div>
          <div className="flex items-center gap-x-2">
            {customHeaderComponents && customHeaderComponents}
            {IS_PLATFORM && (
              <>
                <FeedbackDropdown />
                <NotificationsPopoverV2 />
                <HelpPopover />
              </>
            )}
          </div>
        </div>
        <AnimatePresence initial={false}>
          {!!projectRef && !aiAssistantPanel.open && (
            <motion.div
              className="border-l h-full flex items-center justify-center flex-shrink-0"
              initial={{ opacity: 0, x: 0, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 48 }}
              exit={{ opacity: 0, x: 0, width: 0 }}
              transition={{
                duration: 0.15,
                ease: 'easeOut',
              }}
            >
              <AssistantButton />
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}

export default LayoutHeader
