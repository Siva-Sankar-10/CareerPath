"use client";

import { useState } from "react";

const steps = [
  {
    number: 1,
    title: "Understand the Problem",
    description:
      "Understand what a SOC does and define what your monitoring system needs to detect.",
    learn: ["SOC Fundamentals", "Security Monitoring", "Threat Detection"],
    output: "A clear project scope and list of security events to monitor.",
    status: "completed",
  },
  {
    number: 2,
    title: "Set Up the Environment",
    description:
      "Prepare the tools and environment required to collect and analyze security events.",
    learn: ["Linux", "Wazuh", "Suricata", "Wireshark"],
    output: "A working security monitoring lab.",
    status: "completed",
  },
  {
    number: 3,
    title: "Collect Security Logs",
    description:
      "Collect authentication, system and network security logs from your environment.",
    learn: ["Log Collection", "Windows Events", "Linux Logs"],
    output: "A collection of raw security logs.",
    status: "current",
  },
  {
    number: 4,
    title: "Build the Log Parser",
    description:
      "Parse raw logs and convert them into structured security events.",
    learn: ["Python", "Regular Expressions", "Log Parsing"],
    output: "Structured security event data.",
    status: "upcoming",
  },
  {
    number: 5,
    title: "Create Detection Rules",
    description:
      "Create rules that identify suspicious behavior and generate alerts.",
    learn: ["Threat Detection", "Detection Rules", "MITRE ATT&CK"],
    output: "Working threat detection rules.",
    status: "locked",
  },
  {
    number: 6,
    title: "Build the Dashboard",
    description:
      "Create a dashboard that displays alerts, events and important security metrics.",
    learn: ["Data Visualization", "Dashboards", "Security Analytics"],
    output: "A functional SOC monitoring dashboard.",
    status: "locked",
  },
  {
    number: 7,
    title: "Test the System",
    description:
      "Generate controlled security events and verify that your detection system responds correctly.",
    learn: ["Security Testing", "Incident Investigation"],
    output: "Verified detection and alert results.",
    status: "locked",
  },
  {
    number: 8,
    title: "Document & Deploy",
    description:
      "Document the architecture, setup, detections and results, then prepare the project for your portfolio.",
    learn: ["Technical Documentation", "Git", "Deployment"],
    output: "A portfolio-ready cybersecurity project.",
    status: "locked",
  },
];

export default function SOCMonitoringPage() {
  const [selectedStep, setSelectedStep] = useState(3);

  const selected = steps.find((step) => step.number === selectedStep);

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-indigo-600">
            Project Development Roadmap
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            SOC Monitoring Dashboard
          </h1>

          <p className="mt-3 max-w-3xl text-gray-500">
            Follow the development path from setting up your security lab to
            building a portfolio-ready SOC monitoring project.
          </p>
        </div>

        {/* Project Overview */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-400">Difficulty</p>
            <p className="mt-2 font-semibold text-gray-900">
              Intermediate
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-400">Estimated Time</p>
            <p className="mt-2 font-semibold text-gray-900">
              3–4 Weeks
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-400">Skills</p>
            <p className="mt-2 font-semibold text-gray-900">
              6 Core Skills
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs text-gray-400">Project Progress</p>
            <p className="mt-2 font-semibold text-indigo-600">
              42%
            </p>
          </div>

        </div>

        {/* Overall Progress */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Development Progress
              </p>

              <p className="mt-1 text-xs text-gray-500">
                3 of 8 development stages started or completed
              </p>
            </div>

            <span className="text-lg font-bold text-indigo-600">
              42%
            </span>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: "42%" }}
            />
          </div>

        </div>

        {/* Development Flow */}
        <section className="mt-10">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Development Flow
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Complete each stage to move forward.
            </p>
          </div>

          <div className="space-y-0">

            {steps.map((step, index) => {
              const isSelected = selectedStep === step.number;

              return (
                <div key={step.number}>

                  <button
                    onClick={() => {
                      if (step.status !== "locked") {
                        setSelectedStep(step.number);
                      }
                    }}
                    className={`w-full text-left ${
                      step.status === "locked"
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >

                    <div
                      className={`rounded-2xl border bg-white p-6 transition ${
                        isSelected
                          ? "border-indigo-400 shadow-md ring-2 ring-indigo-100"
                          : step.status === "completed"
                          ? "border-green-200 hover:shadow-md"
                          : step.status === "locked"
                          ? "border-gray-200 opacity-60"
                          : "border-gray-200 hover:border-indigo-200 hover:shadow-md"
                      }`}
                    >

                      <div className="flex flex-col gap-5 md:flex-row md:items-center">

                        {/* Step Number */}
                        <div className="flex items-center gap-4 md:w-72">

                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              step.status === "completed"
                                ? "bg-green-100 text-green-600"
                                : step.status === "current"
                                ? "bg-indigo-100 text-indigo-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {step.status === "completed"
                              ? "✓"
                              : step.status === "locked"
                              ? "🔒"
                              : step.number}
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              STEP {step.number}
                            </p>

                            <h3 className="mt-1 text-lg font-semibold text-gray-900">
                              {step.title}
                            </h3>
                          </div>

                        </div>

                        {/* Description */}
                        <div className="flex-1">
                          <p className="text-sm leading-6 text-gray-500">
                            {step.description}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {step.learn.map((item) => (
                              <span
                                key={item}
                                className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="md:w-28 md:text-right">

                          {step.status === "completed" && (
                            <span className="text-xs font-semibold text-green-600">
                              Completed
                            </span>
                          )}

                          {step.status === "current" && (
                            <span className="text-xs font-semibold text-indigo-600">
                              In Progress
                            </span>
                          )}

                          {step.status === "upcoming" && (
                            <span className="text-xs font-semibold text-gray-500">
                              Upcoming
                            </span>
                          )}

                          {step.status === "locked" && (
                            <span className="text-xs font-semibold text-gray-400">
                              Locked
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                  </button>

                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className="flex h-12 justify-center">
                      <div className="w-px bg-gray-200" />
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        </section>

        {/* Selected Step Details */}
        {selected && (
          <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">

            <p className="text-sm font-medium text-indigo-600">
              Step {selected.number}
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {selected.title}
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
              {selected.description}
            </p>

            {/* What to Learn */}
            <div className="mt-7">
              <h3 className="text-sm font-semibold text-gray-900">
                What to Learn
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {selected.learn.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Expected Output */}
            <div className="mt-7 rounded-xl bg-gray-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Expected Output
              </p>

              <p className="mt-2 text-sm text-gray-700">
                {selected.output}
              </p>
            </div>

            {/* Action */}
            {selected.status !== "locked" && (
              <button className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700">
                Mark Step Complete
              </button>
            )}

          </section>
        )}

      </div>
    </main>
  );
}