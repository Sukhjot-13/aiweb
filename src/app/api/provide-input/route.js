/**
 * @fileoverview Provide Input API - Resume tasks with user input
 */

import { NextResponse } from 'next/server';
import InputRequestManager from '../../../services/InputRequestManager.js';
import { TaskExecutor } from '../../../services/TaskExecutor.js';
import TaskPersistenceService from '../../../services/TaskPersistenceService.js';

// Global manager instances (in production, use proper DI)
const inputManager = new InputRequestManager();
const persistenceService = new TaskPersistenceService();
const executor = new TaskExecutor();

export async function POST(request) {
  try {
    const { taskId, requestId, input } = await request.json();

    if (!taskId || !requestId) {
      return NextResponse.json(
        { error: 'taskId and requestId are required' },
        { status: 400 }
      );
    }

    // Load task
    const task = await persistenceService.loadTask(taskId);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check task is waiting for input
    if (task.status !== 'WAITING_FOR_INPUT') {
      return NextResponse.json(
        { error: `Task is not waiting for input (status: ${task.status})` },
        { status: 400 }
      );
    }

    // Validate and provide input
    const result = inputManager.resolveRequest(requestId, input);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Input validation failed', errors: result.errors },
        { status: 400 }
      );
    }

    // Store input in task
    task.providedInput = input;
    task.inputRequest = null;

    // Transition back to RUNNING
    task.transitionTo('RUNNING');

    // Save task state
    await persistenceService.saveTask(task);

    // Note: In Phase 5, this would resume execution automatically
    // For now, just return success

    return NextResponse.json({
      success: true,
      taskId,
      requestId,
      status: task.status,
      message: 'Input provided successfully. Task ready to resume.',
    });
  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      { error: error.message || ' Failed to provide input' },
      { status: 500 }
    );
  }
}

// GET endpoint to check pending input requests
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId query parameter required' },
        { status: 400 }
      );
    }

    // Get pending request
    const pendingRequest = inputManager.getPendingRequest(taskId);

    if (!pendingRequest) {
      return NextResponse.json({
        hasPendingRequest: false,
        taskId,
      });
    }

    return NextResponse.json({
      hasPendingRequest: true,
      taskId,
      request: pendingRequest.toJSON(),
    });
  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to get input request' },
      { status: 500 }
    );
  }
}
