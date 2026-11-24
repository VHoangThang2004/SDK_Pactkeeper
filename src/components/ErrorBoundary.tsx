import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { useTranslation } from '../core/i18n';

const ErrorFallbackView = ({ onReload }: { onReload: () => void }) => {
  const { t } = useTranslation();

  return (
    <Center padding={6} minHeight="60dvh" width="100%">
      <Card variant="default" padding={6} width="100%">
        <EmptyState
          icon={<Icon icon={AlertCircle} size="lg" color="accent" />}
          title={t('common.errorBoundaryTitle')}
          description={t('common.errorBoundaryDesc')}
          actions={
            <Button
              variant="primary"
              label={t('common.errorBoundaryReload')}
              icon={<Icon icon={RotateCcw} size="sm" />}
              onClick={onReload}
            />
          }
        />
      </Card>
    </Center>
  );
};

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackView onReload={this.handleReload} />;
    }

    return this.props.children;
  }
}
