import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import usePermissionStore, { PermissionChoice } from '../store/permission.js';

const PermissionPrompt: React.FC = () => {
  const { toolCallInProgress, permissionPromise } = usePermissionStore();

  if (!toolCallInProgress || !permissionPromise) {
    return null;
  }

  const items = [
    {
      label: 'Allow Once - Execute this tool once',
      value: 'allow_once' as PermissionChoice
    },
    {
      label: 'Allow for Session - Always allow this tool during this session',
      value: 'allow_session' as PermissionChoice
    },
    {
      label: 'Deny - Cancel this tool execution',
      value: 'deny' as PermissionChoice
    }
  ];

  const handleSelect = (item: { label: string; value: PermissionChoice }) => {
    if (permissionPromise) {
      permissionPromise.resolve(item.value);
    }
  };

  const formatArgs = (args: any): string => {
    if (typeof args === 'object' && args !== null) {
      return Object.entries(args)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');
    }
    return JSON.stringify(args);
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text color="yellow" bold>
          🔒 Permission Required
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          The agent wants to execute: <Text color="cyan" bold>{toolCallInProgress.name}</Text>
        </Text>
      </Box>

      {toolCallInProgress.args && (
        <Box marginBottom={1}>
          <Text>
            With arguments: <Text color="gray">{formatArgs(toolCallInProgress.args)}</Text>
          </Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text color="yellow">Choose an action:</Text>
      </Box>

      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};

export default PermissionPrompt;