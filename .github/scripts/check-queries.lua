#!/usr/bin/env -S nvim -l

-- This file is derivative of the check-queries.lua script found in the 
-- nvim-treesitter project (see the NVIM_TREESITTER_LICENSE file). It has 
-- been heavily modified to suit the purposes of this project checking its 
-- own queries file.

-- Equivalent to print(), but this will ensure consistent output regardless of
-- operating system.
local function io_print(text)
  if not text then
    text = ""
  end
  io.write(text, "\n")
end

local function extract_captures()
  local lines = vim.fn.readfile "captures_source"
  local captures = {}
  local current_query

  for _, line in ipairs(lines) do
    if vim.startswith(line, "### ") then
      current_query = vim.fn.tolower(line:sub(5))
    elseif vim.startswith(line, "@") and current_query then
      if not captures[current_query] then
        captures[current_query] = {}
      end

      table.insert(captures[current_query], vim.split(line:sub(2), " ", true)[1])
    end
  end

  return captures
end

local function get_query_captures()
  local lines = vim.fn.readfile "queries/highlights.scm"
  local captures = {}

  for _, line in ipairs(lines) do
    for capture in line:gmatch("@(%a+)") do
      table.insert(captures, capture)
    end
  end

  return captures
end

local function list_any(list, predicate)
  for _, v in pairs(list) do
    if predicate(v) then
      return true
    end
  end
  return false
end

local function do_check()
  local timings = {}

  local captures = extract_captures()
  local errored = false

  io_print "Check parsers"

  local lang = "authzed"
  local query_type = "highlights"

  local query_captures = get_query_captures()
  for _, capture in ipairs(query_captures) do
    local is_valid = (
    vim.startswith(capture, "_") -- Helpers.
    or list_any(captures[query_type], function(documented_capture)
      return vim.startswith(capture, documented_capture)
    end)
    )
    if not is_valid then
      local error = string.format("(x) Invalid capture @%s in %s for %s.", capture, query_type, lang)
      io_print(error)
      errored = true
    end
  end

  return not errored
end

if not do_check() then
  os.exit(1)
else
  io_print("Check passed!")
end

