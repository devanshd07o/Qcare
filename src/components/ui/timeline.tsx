/* Source: D:\LetsCode\UI_COMPONENTS\originui\apps\origin\registry\default\ui\timeline.tsx (MIT) — adapted to Q-Care clinical tokens */
import * as React from 'react';
import { cn } from '../../utils/cn';

type TimelineContextValue = {
  activeStep: number;
};

const TimelineContext = React.createContext<TimelineContextValue>({ activeStep: 0 });

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number;
  value?: number;
  orientation?: 'horizontal' | 'vertical';
}

function Timeline({
  defaultValue = 0,
  value,
  orientation = 'vertical',
  className,
  ...props
}: TimelineProps) {
  const activeStep = value ?? defaultValue;

  return (
    <TimelineContext.Provider value={{ activeStep }}>
      <div
        className={cn(
          'group/timeline flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
          className
        )}
        data-orientation={orientation}
        data-slot="timeline"
        {...props}
      />
    </TimelineContext.Provider>
  );
}

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
  completed?: boolean;
  active?: boolean;
}

function TimelineItem({
  step,
  completed,
  active,
  className,
  ...props
}: TimelineItemProps) {
  const { activeStep } = React.useContext(TimelineContext);
  const isCompleted = completed !== undefined ? completed : step <= activeStep;

  return (
    <div
      className={cn(
        'group/timeline-item relative flex flex-1 flex-col gap-0.5 group-data-[orientation=vertical]/timeline:ms-10 group-data-[orientation=vertical]/timeline:not-last:pb-7',
        className
      )}
      data-completed={isCompleted ? 'true' : undefined}
      data-active={active ? 'true' : undefined}
      data-slot="timeline-item"
      {...props}
    />
  );
}

function TimelineHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} data-slot="timeline-header" {...props} />;
}

function TimelineSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute self-start bg-[#E2E8F0] group-last/timeline-item:hidden group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:top-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem)] group-data-[orientation=vertical]/timeline:w-[2px] group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-[completed=true]/timeline-item:bg-[#087C80]/35',
        className
      )}
      data-slot="timeline-separator"
      {...props}
    />
  );
}

function TimelineIndicator({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute top-0 -left-6 -translate-x-1/2 flex size-6 items-center justify-center rounded-full border border-[#CBD5E1] bg-white text-[12px] font-semibold text-[#64748B] tabular-nums',
        'group-data-[active=true]/timeline-item:border-[#087C80] group-data-[active=true]/timeline-item:bg-[#087C80] group-data-[active=true]/timeline-item:text-white',
        'group-data-[completed=true]/timeline-item:border-[#047857] group-data-[completed=true]/timeline-item:bg-[#047857] group-data-[completed=true]/timeline-item:text-white',
        className
      )}
      data-slot="timeline-indicator"
      {...props}
    >
      {children}
    </div>
  );
}

function TimelineTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-[14px] font-semibold text-[#0F172A] leading-snug', className)}
      data-slot="timeline-title"
      {...props}
    />
  );
}

function TimelineContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('text-[12.5px] text-[#64748B] leading-relaxed', className)}
      data-slot="timeline-content"
      {...props}
    />
  );
}

function TimelineDate({ className, ...props }: React.HTMLAttributes<HTMLTimeElement>) {
  return (
    <time
      className={cn('block text-[12px] font-medium text-[#64748B] tabular-nums', className)}
      data-slot="timeline-date"
      {...props}
    />
  );
}

export {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle
};
